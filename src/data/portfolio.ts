export type PortfolioLink = { label: string; href: string };
export type Project = {
  slug: string; title: string; date: string; category: string; summary: string;
  stack: string[]; purpose: string; contributions: string[]; verification: string[];
  architecture?: string; incident?: string; measurements?: string; links: PortfolioLink[];
};
export const profile: { name: string; introduction: string; degree: string; links: PortfolioLink[]; resume: PortfolioLink | null } = {
  name: "Soponloe Sovann",
  introduction: "I deploy and maintain Linux-based systems, connect the infrastructure behind applications, and investigate what happens when things go wrong.",
  degree: "Computer science graduate focused on cloud infrastructure and operations.",
  links: [
    { label: "GitHub", href: "https://github.com/ponloe" },
    { label: "Email", href: "mailto:sovannsoponloe@gmail.com" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/soponloe/" },
  ],
  resume: null, // After adding public/resume.pdf: { label: "Résumé", href: "/resume.pdf" }
};
export const projects: Project[] = [
  {
    slug: "digitalocean-deployment", title: "Cloud-Based Scalable Application Deployment", date: "February 2025", category: "INFRASTRUCTURE", summary: "Linux application infrastructure with DNS, load balancing, replication, and backups.",
    stack: ["DigitalOcean", "Linux", "Cloudflare", "Apache", "DNS", "Load Balancer"],
    purpose: "Deploy and maintain Linux-based application infrastructure on DigitalOcean, with availability and recovery in mind.",
    contributions: ["Configured DNS, firewall rules, service ports, and load balancing to improve availability.", "Configured Cloudflare for DNS and CDN delivery.", "Managed database replication and backups to support reliability and recovery."],
    verification: ["Performed routine service checks as part of infrastructure maintenance."],
    // Add the confirmed traffic path, replication topology, and backup/recovery process.
    architecture: undefined, links: [],
  },
  {
    slug: "cinemesh", title: "CineMesh", date: "March 2026", category: "BACKEND & OPERATIONS", summary: "Go services on Linux, with authentication, access control, and a practical troubleshooting workflow.",
    stack: ["Go", "Gin", "PostgreSQL", "Linux", "systemd", "Nginx"],
    purpose: "Deploy and manage Go backend services on Linux with authenticated access and reliable data structures.",
    contributions: ["Configured the Linux runtime environment and managed Go backend services.", "Implemented authentication and role-based access control.", "Designed PostgreSQL structures with data integrity in mind."],
    verification: ["Checked service status to investigate whether backend services were running.", "Inspected logs to diagnose API, database, and service failures.", "Used curl requests to inspect API behavior and verify responses alongside service status and logs."],
    incident: undefined, // Add a real incident: symptom, evidence, diagnosis, fix, and verification.
    links: [],
  },
  {
    slug: "vm-consolidation", title: "Heuristic-Based Dynamic VM Consolidation Research", date: "March 2026", category: "SIMULATION RESEARCH", summary: "A threshold-based VM migration strategy evaluated across workloads in CloudSim.",
    stack: ["CloudSim", "Java", "Virtualization"],
    purpose: "Explore the trade-off between reducing energy use and limiting SLA violations and migration overhead through VM consolidation. This is simulation research.",
    contributions: ["Designed a threshold-based strategy for deciding when to migrate virtual machines and where to place them.", "Drew on ETSI NFV architecture principles in the strategy’s design."],
    verification: ["Evaluated the strategy in CloudSim across different workloads.", "Measured energy consumption, SLA violations, and migration overhead to assess the costs and benefits of consolidation."],
    measurements: undefined, // Publish quantitative results only after supplying measurements.
    links: [],
  },
];
export const skills: { group: string; handsOn: string[]; learning: string[] }[] = [
  { group: "Cloud platforms", handsOn: ["DigitalOcean", "Cloudflare DNS & CDN"], learning: [] },
  { group: "Linux", handsOn: ["Runtime configuration", "systemd", "Service status & logs"], learning: [] },
  { group: "Networking", handsOn: ["DNS", "Firewall rules", "Service ports", "Load balancing"], learning: [] },
  { group: "Containers", handsOn: ["Docker"], learning: ["Kubernetes"] }, // Add specific learning areas when confirmed.
  { group: "Deployment", handsOn: ["Go services", "Nginx", "Apache", "PostgreSQL", "Replication & backups"], learning: [] },
];

// Illustrative browser-only scripts, separate from verified project claims.
// Edit this sample incident here; project.incident remains reserved for a real incident.
export type DemoScript = {
  command: "deploy" | "diagnose cinemesh";
  projectSlug: string;
  title: string;
  notice: string;
  opening?: string;
  stageDuration: number;
  stages: { title: string; output: string }[];
};
export const demos: DemoScript[] = [
  {
    command: "deploy", projectSlug: "digitalocean-deployment",
    title: "Simulated deployment",
    notice: "Sample output only. No actual deployment or live health check is performed.",
    stageDuration: 600,
    stages: [
      { title: "Build application artifact", output: "sample artifact: application.tar.gz — ready" },
      { title: "Start application service", output: "sample service: active (running)" },
      { title: "Check service health", output: "sample health response: HTTP 200 OK" },
    ],
  },
  {
    command: "diagnose cinemesh", projectSlug: "cinemesh",
    title: "Simulated troubleshooting walkthrough",
    notice: "Illustrative sample incident, not a real CineMesh incident. Commands and responses are simulated; no requests or system changes are made.",
    opening: "$ curl http://localhost:8080/health\ncurl: (7) Failed to connect — sample API request failure",
    stageDuration: 700,
    stages: [
      { title: "Check the systemd service status", output: "$ systemctl status cinemesh\nActive: failed (sample)" },
      { title: "Inspect application logs", output: "$ journalctl -u cinemesh -n 20\nSample log: required DATABASE_URL is missing.\nSample fix: set the missing runtime configuration and restart the service." },
      { title: "Verify the endpoint with curl", output: "$ curl -i http://localhost:8080/health\nHTTP/1.1 200 OK (sample, after the fix)" },
    ],
  },
];
