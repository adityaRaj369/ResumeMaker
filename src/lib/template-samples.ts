import type { ResumeContent } from "@/lib/types";

export type FormSectionId =
  | "contact"
  | "summary"
  | "skills"
  | "experience"
  | "education"
  | "projects"
  | "certifications"
  | "coding";

const BLOCK_TO_SECTION: Record<string, FormSectionId> = {
  summaryBlock: "summary",
  educationBlock: "education",
  experienceBlock: "experience",
  projectsBlock: "projects",
  skillsBlock: "skills",
  certificationsBlock: "certifications",
  codingBlock: "coding",
};

/** Form section order follows placeholders as they appear in the real LaTeX template. */
export function formSectionsFromLatex(latexSource: string): FormSectionId[] {
  const sections: FormSectionId[] = ["contact"];
  const seen = new Set<FormSectionId>(["contact"]);
  const re = /\{\{(summaryBlock|educationBlock|experienceBlock|projectsBlock|skillsBlock|certificationsBlock|codingBlock)\}\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(latexSource))) {
    const id = BLOCK_TO_SECTION[m[1]];
    if (id && !seen.has(id)) {
      seen.add(id);
      sections.push(id);
    }
  }
  return sections;
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

/** Shared RenderCV demo body used by several published sample PNGs. */
const RENDERCV_JOHN: ResumeContent = {
  fullName: "John Doe",
  email: "john.doe@email.com",
  phone: "",
  location: "San Francisco, CA",
  linkedinUrl: "https://linkedin.com/in/rendercv",
  githubUrl: "https://github.com/rendercv",
  portfolioUrl: "https://rendercv.com",
  summary:
    "RenderCV reads a CV written in a YAML file and generates a PDF with professional typography. Each section title is arbitrary — Markdown syntax is supported everywhere (**bold**, *italic*, and links).",
  skills: [],
  skillCategories: {
    languages: ["Python", "C++", "CUDA", "TypeScript"],
    frameworks: ["PyTorch", "JAX", "React"],
    tools: ["Docker", "Kubernetes", "AWS"],
  },
  experience: [
    {
      company: "Nexus AI",
      title: "Co-Founder & CTO",
      location: "San Francisco, CA",
      startDate: "June 2023",
      endDate: "Present",
      bullets: [
        "Built foundation model infrastructure serving 2M+ monthly API requests with 99.97% uptime",
        "Raised $18M Series A led by Sequoia Capital, with participation from a16z and Founders Fund",
        "Scaled engineering team from 3 to 28 across ML research, platform, and applied AI divisions",
        "Developed proprietary inference optimization reducing latency by 73% compared to baseline",
      ],
    },
    {
      company: "NVIDIA Research",
      title: "Research Intern",
      location: "Santa Clara, CA",
      startDate: "May 2022",
      endDate: "Aug 2022",
      bullets: [
        "Designed sparse attention mechanism reducing transformer memory footprint by 4.2x",
        "Co-authored paper accepted at NeurIPS 2022 (spotlight presentation, top 5% of submissions)",
      ],
    },
    {
      company: "Google DeepMind",
      title: "Research Intern",
      location: "London, UK",
      startDate: "May 2021",
      endDate: "Aug 2021",
      bullets: [
        "Developed reinforcement learning algorithms for multi-agent coordination",
        "ICML 2022 main conference paper, cited 340+ times within two years",
        "NeurIPS 2022 workshop paper on emergent communication protocols",
        "Invited journal extension in JMLR (2023)",
      ],
    },
    {
      company: "Apple ML Research",
      title: "Research Intern",
      location: "Cupertino, CA",
      startDate: "May 2020",
      endDate: "Aug 2020",
      bullets: [
        "Created on-device neural network compression pipeline deployed across 50M+ devices",
        "Filed 2 patents on efficient model quantization techniques for edge inference",
      ],
    },
    {
      company: "Microsoft Research",
      title: "Research Intern",
      location: "Redmond, WA",
      startDate: "May 2019",
      endDate: "Aug 2019",
      bullets: [
        "Researched self-supervised learning methods for multimodal representations",
        "Prototyped training pipelines integrated with Azure ML",
      ],
    },
  ],
  education: [
    {
      school: "Princeton University",
      degree: "PhD",
      field: "Computer Science",
      location: "Princeton, NJ",
      startDate: "Sept 2018",
      endDate: "May 2023",
      gpa: "",
      highlights: [
        "Thesis: Efficient Neural Architecture Search for Resource-Constrained Deployment",
        "Advisor: Prof. Sanjeev Arora",
        "NSF Graduate Research Fellowship, Siebel Scholar (Class of 2022)",
      ],
    },
    {
      school: "Boğaziçi University",
      degree: "BS",
      field: "Computer Engineering",
      location: "Istanbul, Türkiye",
      startDate: "Sept 2014",
      endDate: "June 2018",
      gpa: "3.97/4.00",
      highlights: [
        "GPA: 3.97/4.00, Valedictorian",
        "Fulbright Scholarship recipient for Graduate Studies",
      ],
    },
  ],
  projects: [
    {
      name: "FlashInfer",
      description: "Open-source library for high-performance LLM inference kernels",
      bullets: [
        "Open-source library for high-performance LLM inference kernels",
        "Adopted by multiple production inference stacks",
      ],
      link: "",
      tech: ["CUDA", "Python"],
    },
    {
      name: "NeuralPrune",
      description: "Automated neural network pruning toolkit",
      bullets: [
        "Automated neural network pruning for edge deployment",
        "Reduced model size with minimal accuracy loss",
      ],
      link: "",
      tech: ["PyTorch"],
    },
  ],
  certifications: [],
  codingProfiles: {},
};

const JAKES: ResumeContent = {
  fullName: "Jake Gutierrez",
  email: "g@southwestern.edu",
  phone: "xxx-xxx-xxxx",
  location: "",
  linkedinUrl: "https://linkedin.com/in/jakegut",
  githubUrl: "https://github.com/jakeryang",
  portfolioUrl: "",
  summary: "",
  skills: [],
  skillCategories: {
    languages: ["Java", "Python", "C/C++", "SQL (Postgres)", "JavaScript", "HTML/CSS", "R"],
    frameworks: ["React", "Node.js", "Flask", "JUnit", "WordPress", "Material-UI", "FastAPI"],
    tools: [
      "Git",
      "Docker",
      "TravisCI",
      "Google Cloud Platform",
      "VS Code",
      "Visual Studio",
      "PyCharm",
      "IntelliJ",
      "Eclipse",
      "pandas",
      "NumPy",
      "Matplotlib",
    ],
  },
  experience: [
    {
      company: "Texas A&M University",
      title: "Undergraduate Research Assistant",
      location: "College Station, TX",
      startDate: "June 2020",
      endDate: "Present",
      bullets: [
        "Developed a REST API using FastAPI and PostgreSQL to store data from learning management systems",
        "Developed a full-stack web application using Flask, React, PostgreSQL and Docker to analyze GitHub data",
        "Explored ways to visualize GitHub collaboration in a classroom setting",
      ],
    },
    {
      company: "Southwestern University",
      title: "Information Technology Support Specialist",
      location: "Georgetown, TX",
      startDate: "Sep. 2018",
      endDate: "Present",
      bullets: [
        "Communicate with managers to set up campus computers used on campus",
        "Assess and troubleshoot computer problems brought by students, faculty and staff",
        "Maintain upkeep of computers, classroom equipment, and 200 printers across campus",
      ],
    },
    {
      company: "Southwestern University",
      title: "Artificial Intelligence Research Assistant",
      location: "Georgetown, TX",
      startDate: "May 2019",
      endDate: "July 2019",
      bullets: [
        "Explored methods to generate video game dungeons based off of The Legend of Zelda",
        "Developed a game in Java to test the generated dungeons",
        "Contributed 50K+ lines of code to an established codebase via Git",
        "Conducted a human subject study to determine which video game dungeon generation technique is enjoyable",
        "Wrote an 8-page paper and gave multiple presentations on-campus",
        "Presented virtually to the World Conference on Computational Intelligence",
      ],
    },
  ],
  education: [
    {
      school: "Southwestern University",
      degree: "Bachelor of Arts",
      field: "Computer Science, Minor in Business",
      location: "Georgetown, TX",
      startDate: "Aug. 2018",
      endDate: "May 2021",
    },
    {
      school: "Blinn College",
      degree: "Associate's",
      field: "Liberal Arts",
      location: "Bryan, TX",
      startDate: "Aug. 2014",
      endDate: "May 2018",
    },
  ],
  projects: [
    {
      name: "Gitlytics",
      bullets: [
        "Developed a full-stack web application using Flask serving a REST API with React as the frontend",
        "Implemented GitHub OAuth to get data from user's repositories",
        "Visualized GitHub data to show collaboration",
        "Used Celery and Redis for asynchronous tasks",
      ],
      link: "",
      tech: ["Python", "Flask", "React", "PostgreSQL", "Docker"],
    },
    {
      name: "Simple Paintball",
      bullets: [
        "Developed a Minecraft server plugin to entertain kids during free time for a previous job",
        "Published plugin to websites gaining 2K+ downloads and an average 4.5/5-star review",
        "Implemented continuous delivery using TravisCI to build the plugin upon a new release",
        "Collaborated with Minecraft server administrators to suggest features and get feedback about the plugin",
      ],
      link: "",
      tech: ["Spigot API", "Java", "Maven", "TravisCI", "Git"],
    },
  ],
  certifications: [],
  codingProfiles: {},
};

const SB2NOV: ResumeContent = {
  fullName: "Sourabh Bajaj",
  email: "sourabh@sourabhbajaj.com",
  phone: "+1-123-456-7890",
  location: "",
  linkedinUrl: "",
  githubUrl: "",
  portfolioUrl: "http://www.sourabhbajaj.com",
  summary: "",
  skills: [],
  skillCategories: {
    languages: ["Python", "C++", "Java", "Go"],
    frameworks: ["TensorFlow", "Apache Beam", "Kubernetes"],
    tools: ["Git", "Docker", "GCP"],
  },
  experience: [
    {
      company: "Google",
      title: "Software Engineer",
      location: "Mountain View, CA",
      startDate: "Oct 2016",
      endDate: "Present",
      bullets: [
        "**TensorFlow:** Open source software library for numerical computation using data flow graphs",
        "**Apache Beam:** Unified model for defining both batch and streaming data-parallel processing pipelines",
        "Built and shipped production ML infrastructure used across Google products",
      ],
    },
    {
      company: "Google",
      title: "Software Engineer",
      location: "Mountain View, CA",
      startDate: "Oct 2014",
      endDate: "Sep 2016",
      bullets: [
        "Worked on large-scale distributed systems and data processing pipelines",
        "Improved reliability and performance of internal developer tooling",
      ],
    },
    {
      company: "Coursera",
      title: "Software Engineer",
      location: "Mountain View, CA",
      startDate: "Jan 2014",
      endDate: "Sep 2014",
      bullets: [
        "Built learning platform features used by millions of students",
        "Shipped A/B experiments improving course completion metrics",
      ],
    },
  ],
  education: [
    {
      school: "Georgia Institute of Technology",
      degree: "Master of Science",
      field: "Computer Science",
      location: "Atlanta, GA",
      startDate: "Aug. 2012",
      endDate: "Dec. 2013",
      gpa: "4.00",
    },
    {
      school: "Indian Institute of Technology Bombay",
      degree: "Bachelor of Technology",
      field: "Electrical Engineering",
      location: "Mumbai, India",
      startDate: "Jul. 2008",
      endDate: "May 2012",
    },
  ],
  projects: [
    {
      name: "QuantSoftware Toolkit",
      bullets: [
        "Open source python library for financial data analysis and machine learning for finance",
      ],
      link: "",
      tech: ["Python"],
    },
    {
      name: "Github Visualization",
      bullets: ["Data visualization of GitHub activity and collaboration patterns"],
      link: "",
      tech: ["JavaScript", "D3"],
    },
  ],
  certifications: [],
  codingProfiles: {},
};

const DEEDY: ResumeContent = {
  fullName: "Debarghya Das",
  email: "deedy@fb.com",
  phone: "607.379.5733",
  location: "New York, NY",
  linkedinUrl: "",
  githubUrl: "https://github.com/deedy",
  portfolioUrl: "https://debarghyadas.com",
  summary: "",
  skills: [],
  skillCategories: {
    languages: ["Java", "Shell", "Python", "JavaScript", "Matlab", "Rails", "PHP"],
    frameworks: ["C", "C++", "C#", "Objective-C", "R", "SML", "SQL"],
    tools: ["AS3", "iOS", "Android", "HTML5", "CSS3"],
  },
  experience: [
    {
      company: "Facebook",
      title: "Software Engineer",
      location: "New York, NY",
      startDate: "Jan 2015",
      endDate: "Present",
      bullets: [
        "Built and shipped product features used by millions of people",
        "Owned end-to-end delivery across backend services and client surfaces",
      ],
    },
    {
      company: "Coursera",
      title: "Software Engineering Intern",
      location: "Mountain View, CA",
      startDate: "May 2014",
      endDate: "Aug 2014",
      bullets: [
        "Worked on learning platform infrastructure and student-facing features",
      ],
    },
  ],
  education: [
    {
      school: "Cornell University",
      degree: "MEng",
      field: "Computer Science",
      location: "Ithaca, NY",
      startDate: "",
      endDate: "Dec 2014",
      gpa: "3.83 / 4.0",
    },
    {
      school: "Cornell University",
      degree: "BS",
      field: "Computer Science",
      location: "Ithaca, NY",
      startDate: "",
      endDate: "May 2014",
    },
  ],
  projects: [
    {
      name: "Research & publications",
      bullets: [
        "Machine learning and systems research during graduate studies at Cornell",
      ],
      link: "",
      tech: [],
    },
  ],
  certifications: [
    { name: "Competitive programming awards", issuer: "Various contests", date: "2010–2014" },
  ],
  codingProfiles: {},
};

const BY_SLUG: Record<string, ResumeContent> = {
  jakes: JAKES,
  sb2nov: SB2NOV,
  "deedy-safe": DEEDY,
  harvard: RENDERCV_JOHN,
  engineeringresumes: RENDERCV_JOHN,
  engineeringclassic: RENDERCV_JOHN,
  classic: RENDERCV_JOHN,
  moderncv: RENDERCV_JOHN,
  ink: RENDERCV_JOHN,
};

/**
 * Content taken from the published sample for that template (gallery PNG / upstream demo).
 * Opening edit pre-fills the form with these exact fields so users can rewrite them.
 */
export function sampleContentForTemplate(slug: string): ResumeContent {
  const key = slug.toLowerCase();
  const match = BY_SLUG[key] ?? Object.entries(BY_SLUG).find(([s]) => key.includes(s))?.[1];
  return clone(match ?? RENDERCV_JOHN);
}
