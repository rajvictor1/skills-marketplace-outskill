"""Read-only text-package preparation. Never extracts ZIPs or runs supplied code.
Usage: python3 scripts/recipe-pack-to-json.py SOURCE MANIFEST_PATH > /private/tmp/package.json
SOURCE may be a directory or ZIP. MANIFEST_PATH is relative to the selected root.
"""
import json
import pathlib
import stat
import sys
import zipfile

source = pathlib.Path(sys.argv[1])
manifest = sys.argv[2] if len(sys.argv) > 2 else 'recipe.yaml'
allowed = {'.md', '.txt', '.json', '.yaml', '.yml', '.py', '.js', '.ts', '.sh'}
entries = []
size = 0

def add(name, data):
    global size
    path = pathlib.PurePosixPath(name)
    if path.is_absolute() or any(p in {'..', '.', ''} for p in path.parts):
        raise ValueError('Unsafe package path')
    if any(p.startswith('.') or p == '__pycache__' for p in path.parts):
        return
    if path.suffix.lower() not in allowed:
        return
    size += len(data)
    if len(data) > 256 * 1024 or size > 768 * 1024 or len(entries) >= 256:
        raise ValueError('Package exceeds the text importer limits')
    entries.append({'path': str(path), 'content': data.decode('utf-8-sig', errors='strict')})

if source.is_dir():
    for path in sorted(source.rglob('*')):
        if path.is_symlink():
            raise ValueError('Symlinks are not accepted')
        if path.is_file() and path.suffix.lower() in allowed:
            if path.stat().st_size > 256 * 1024:
                raise ValueError('File too large')
            add(path.relative_to(source).as_posix(), path.read_bytes())
else:
    with zipfile.ZipFile(source) as archive:
        members = [i for i in archive.infolist() if not i.is_dir()]
        if len(members) > 512:
            raise ValueError('Archive has too many entries')
        roots = {i.filename.split('/')[0] for i in members}
        prefix = next(iter(roots)) + '/' if len(roots) == 1 and all('/' in i.filename for i in members) else ''
        for info in members:
            if stat.S_ISLNK(info.external_attr >> 16):
                raise ValueError('Symlinks are not accepted')
            name = info.filename[len(prefix):]
            if pathlib.PurePosixPath(name).suffix.lower() not in allowed:
                continue
            if info.file_size > 256 * 1024 or (info.compress_size and info.file_size / info.compress_size > 200):
                raise ValueError('Unsafe archive expansion')
            add(name, archive.read(info))
json.dump({'files': entries, 'manifestPath': manifest}, sys.stdout, ensure_ascii=False)
