import { Link, Navigate, useParams } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { getTool, tools } from "@/data/tools";
import { ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";

export default function ToolPage() {
  const { slug } = useParams();
  const tool = getTool(slug);

  if (!tool) return <Navigate to="/dashboard" replace />;

  const index = tools.findIndex((t) => t.slug === tool.slug);
  const next = tools[(index + 1) % tools.length];

  return (
    <AppLayout>
      <article className="mx-auto max-w-[760px] px-6 py-10">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All tools
        </Link>

        <header className="mt-6 pb-8 border-b border-border">
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 flex items-center justify-center border border-border"
              style={{ color: tool.accent }}
            >
              <tool.icon style={{ width: 20, height: 20 }} />
            </div>
            <div>
              <h1 className="text-[24px] font-[500] tracking-[-0.02em] text-foreground leading-tight">
                {tool.name}
              </h1>
              <span className="text-[12px] text-muted-foreground">{tool.tagline}</span>
            </div>
          </div>
          <p className="mt-6 text-[15px] leading-[1.65] text-muted-foreground">{tool.intro}</p>
        </header>

        <div className="divide-y divide-border">
          {tool.sections.map((section, i) => (
            <section key={section.heading} className="py-8">
              <span className="text-[11px] font-mono text-muted-foreground">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h2 className="mt-2 text-[16px] font-medium text-foreground">{section.heading}</h2>
              <p className="mt-3 text-[14px] leading-[1.7] text-muted-foreground">{section.body}</p>
              {section.code && (
                <pre className="mt-5 overflow-x-auto border border-border bg-card p-4 text-[12.5px] leading-[1.7] font-mono text-foreground/85">
                  <code>{section.code}</code>
                </pre>
              )}
            </section>
          ))}
        </div>

        <section className="pt-8 border-t border-border">
          <h2 className="text-[13px] uppercase tracking-[0.12em] text-muted-foreground">
            Keep reading
          </h2>
          <ul className="mt-4 space-y-2">
            {tool.resources.map((r) => (
              <li key={r.href}>
                <a
                  href={r.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-[13px] text-foreground hover:underline"
                >
                  {r.label}
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                </a>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-10 pt-6 border-t border-border flex justify-end">
          <Link
            to={`/learn/${next.slug}`}
            className="group inline-flex items-center gap-2 border border-border px-4 py-2.5 text-[13px] text-foreground hover:bg-accent transition-colors"
          >
            Next: {next.name}
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </article>
    </AppLayout>
  );
}
