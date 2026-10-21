export type Faq = { question: string; answer: string };
export const HOME_FAQ: Faq[] = [
  {
    question: "What is an AI agent skill?",
    answer:
      "An AI agent skill is a reusable set of instructions, commonly stored in a SKILL.md file, that guides an agent through a specific task. Skillbuffet lets you inspect those instructions and the creator’s declared requirements before downloading. Your chosen agent runs the skill; Skillbuffet does not run it for you.",
  },
  {
    question: "Does approval guarantee a skill is safe?",
    answer:
      "No. Skillbuffet combines automated checks with administrator review of a saved version. Checks can miss harmful behavior, inaccurate instructions or risks introduced by external services. Read the full instructions, check the requested access and avoid using sensitive data until you understand how your agent will handle it.",
  },
  {
    question: "Can I publish without a GitHub repository?",
    answer:
      "Yes. Sign in and upload or paste a SKILL.md file, then complete its category, version, license, compatibility and access declarations. A GitHub link is optional for file submissions. New skills and new versions stay private until an administrator approves the submitted version.",
  },
  {
    question: "Are n8n templates the same as AI agent skills?",
    answer:
      "No. An n8n template is a JSON workflow that you import into your own n8n instance and configure with the required credentials. A SKILL.md file contains instructions for a compatible AI agent. Skillbuffet presents workflow templates separately because their installation, execution and security requirements differ.",
  },
];
export function categoryFaq(name: string): Faq[] {
  return [
    {
      question: `How do I choose a ${name.toLowerCase()} skill?`,
      answer: `Start with the task you need to complete in ${name}. Open a listing to compare its summary, supported agents, declared inputs and outputs, license and requested access. Review the saved instructions and scan findings before downloading. A category match alone does not establish suitability for your data or workflow.`,
    },
    {
      question: `How are ${name.toLowerCase()} submissions reviewed?`,
      answer:
        "Each submitted version goes through automated static checks and a separate administrator decision. Critical findings block approval. An approved version can enter the public catalog; pending, rejected and blocked submissions remain private. Approval applies to the saved version and does not guarantee accuracy or the safety of external services.",
    },
    {
      question: `Can I contribute a skill in ${name}?`,
      answer: `Yes. Sign in, choose ${name} and the closest specialty in the publishing form, and provide one SKILL.md file with a clear name and description. Explain its inputs, outputs, compatibility, license, access needs and limitations. The administrator reviews the submission before it becomes publicly available.`,
    },
  ];
}

export function skillFaq(name: string): Faq[] {
  return [
    {
      question: `Where does ${name} run?`,
      answer: `${name} runs in your own compatible AI agent environment. Skillbuffet distributes its saved instruction file and shows the creator’s declarations and review results. The marketplace does not execute the agent, connect your accounts or verify every possible output. Follow your agent application's installation instructions and check the skill's stated requirements.`,
    },
    {
      question: "What does administrator approval mean?",
      answer:
        "Approval means an administrator accepted the saved version displayed on this listing after reviewing its submitted instructions, declarations and automated findings. Approval does not certify accuracy or safety. External websites and repositories can change independently, so inspect instructions and permissions before using a downloaded version with your data.",
    },
    {
      question: "How are downloads and ratings counted?",
      answer:
        "A signed-in non-creator account counts once per downloaded skill version. That record does not prove installation or successful execution. A recorded downloader can leave one editable star rating and optional public comment. Creator self-ratings are disallowed, and marketplace ratings remain separate from the security scan and administrator decision.",
    },
  ];
}
