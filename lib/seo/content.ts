export type Faq = { question: string; answer: string };
export const HOME_FAQ: Faq[] = [
  {
    question: "What is a recipe on Skillbuffet?",
    answer:
      "A recipe is a reusable set of instructions or a structured package for a task. New packages include recipe.yaml, local schemas and supporting files; older recipes may be a single SKILL.md file. You can inspect the reviewed version before downloading it. Skillbuffet does not install or run recipes for you.",
  },
  {
    question: "How does a recipe become public?",
    answer:
      "The creator submits one recipe and chooses its category. Skillbuffet checks its files and scans for suspicious content. An administrator reviews the saved version and can approve it, request changes or reject it. Only an approved version appears in the public catalog.",
  },
  {
    question: "Can I upload a ZIP with several recipes?",
    answer:
      "Yes. The publisher finds the recipes in your ZIP. Choose one valid recipe, its category and reuse terms, then submit it for review. You can use the same ZIP again to submit another recipe. The current ZIP limit is 1.5 MB. A GitHub repository is not required.",
  },
  {
    question: "What do I get when I download a recipe?",
    answer:
      "A structured recipe downloads as recipe-package.json containing its reviewed source files. An older instruction-only recipe downloads as SKILL.md. You must inspect and integrate either format in your own environment; a structured contract may still need a working adapter or provider connection.",
  },
  {
    question: "Does approval guarantee safety or a working recipe?",
    answer:
      "No. File checks, static scanning and administrator review can miss risks and do not prove that an external integration works. Check the requested access and runtime status, and try the recipe with non-sensitive data before relying on it.",
  },
];
export function categoryFaq(name: string): Faq[] {
  return [
    {
      question: `How do I choose a ${name.toLowerCase()} recipe?`,
      answer: `Start with the task you need to complete in ${name}. Open a listing to compare its summary, saved files, required inputs, reuse terms, scan findings and runtime status. A category match alone does not mean the recipe will work with your system or data.`,
    },
    {
      question: `How are ${name.toLowerCase()} submissions reviewed?`,
      answer:
        "Each submitted version goes through automated static checks and a separate administrator decision. Critical findings block approval. An approved version can enter the public catalog; pending, rejected and blocked submissions remain private. Approval applies to the saved version and does not guarantee accuracy or the safety of external services.",
    },
    {
      question: `Can I contribute a recipe in ${name}?`,
      answer: `Yes. Sign in, upload a ZIP with recipe.yaml and its required local files, then choose one valid recipe, ${name} and the closest specialty. Declare reuse terms and confirm publishing rights. An administrator must approve the saved version before it becomes public. The legacy SKILL.md form remains available for instruction-only recipes.`,
    },
  ];
}

export function skillFaq(name: string, isStructuredPackage = false): Faq[] {
  return [
    {
      question: `Where does ${name} run?`,
      answer: isStructuredPackage
        ? `${name} is a downloadable recipe package. Its manifest and schemas describe a contract, but this listing does not establish a working adapter or provider connection. Skillbuffet does not install or execute it, and administrator approval does not verify a runtime result.`
        : `${name} uses instructions intended for a compatible AI agent environment. Skillbuffet distributes the saved instructions and shows the creator’s declarations and review results. It does not execute the agent, connect your accounts or verify every output. Check your agent application's installation instructions and the recipe's stated requirements.`,
    },
    {
      question: "What does administrator approval mean?",
      answer:
        "Approval means an administrator accepted the saved version displayed on this listing after reviewing its submitted instructions, declarations and automated findings. Approval does not certify accuracy or safety. External websites and repositories can change independently, so inspect instructions and permissions before using a downloaded version with your data.",
    },
    {
      question: "How are downloads and ratings counted?",
      answer:
        "A signed-in non-creator account counts once per downloaded recipe version. That record does not prove installation or successful execution. A recorded downloader can leave one editable star rating and optional public comment. Creator self-ratings are disallowed, and marketplace ratings remain separate from the security scan and administrator decision.",
    },
  ];
}
