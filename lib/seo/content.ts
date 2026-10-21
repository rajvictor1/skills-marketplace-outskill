export type Faq = { question: string; answer: string };
export const HOME_FAQ: Faq[] = [
  {
    question: "What is an AI agent recipe?",
    answer:
      "On Skillbuffet, an AI agent recipe describes a reusable task. New structured recipes use a recipe.yaml manifest with bundled schemas and files; older instruction-only recipes use SKILL.md. Skillbuffet lets you inspect the saved package and creator declarations before downloading. It does not install or run a recipe for you.",
  },
  {
    question: "Does approval guarantee a recipe is safe?",
    answer:
      "No. Skillbuffet combines automated checks with administrator review of a saved version. Checks can miss harmful behavior, inaccurate instructions or risks introduced by external services. Read the full instructions, check the requested access and avoid using sensitive data until you understand how your agent will handle it.",
  },
  {
    question: "Can I publish without a GitHub repository?",
    answer:
      "Yes. Sign in and upload a ZIP containing recipe.yaml and its required local schemas and files. Choose one recipe, category, subcategory and reuse terms, then submit it for administrator review. A GitHub link is not required. Older SKILL.md instructions remain available through the legacy form. New versions stay private until approved.",
  },
  {
    question: "Are n8n templates the same as AI agent recipes?",
    answer:
      "No. An n8n template is a JSON workflow for an n8n instance. A structured Skillbuffet recipe has a recipe.yaml manifest and declared input and output schemas. Neither format is automatically installed or executed by the marketplace.",
  },
];
export function categoryFaq(name: string): Faq[] {
  return [
    {
      question: `How do I choose a ${name.toLowerCase()} recipe?`,
      answer: `Start with the task you need to complete in ${name}. Open a listing to compare its summary, supported agents, declared inputs and outputs, license and requested access. Review the saved instructions and scan findings before downloading. A category match alone does not establish suitability for your data or workflow.`,
    },
    {
      question: `How are ${name.toLowerCase()} submissions reviewed?`,
      answer:
        "Each submitted version goes through automated static checks and a separate administrator decision. Critical findings block approval. An approved version can enter the public catalog; pending, rejected and blocked submissions remain private. Approval applies to the saved version and does not guarantee accuracy or the safety of external services.",
    },
    {
      question: `Can I contribute a recipe in ${name}?`,
      answer: `Yes. Sign in, upload a ZIP with recipe.yaml and its required local files, then choose one recipe, ${name} and the closest specialty in the publishing form. Declare reuse terms and confirm publishing rights. The administrator reviews that saved version before it becomes public. The older SKILL.md form remains available for instruction-only recipes.`,
    },
  ];
}

export function skillFaq(name: string, isStructuredPackage = false): Faq[] {
  return [
    {
      question: `Where does ${name} run?`,
      answer: isStructuredPackage
        ? `${name} is currently a downloadable recipe package. Its manifest and schemas describe a contract, but an adapter and provider setup are still required before it can run. Skillbuffet does not install or execute it, and administrator approval does not verify a runtime result.`
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
