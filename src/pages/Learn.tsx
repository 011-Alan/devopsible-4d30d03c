import { Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { tools } from "@/data/tools";
import { ArrowRight } from "lucide-react";

export default function Learn() {
  const { profile } = useAuth();
  const firstName = profile?.full_name?.split(" ")[0];

  return (
    <AppLayout>
      <div className="mx-auto max-w-[1100px] px-6 py-10">
        <header className="mb-10">
          <p className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground mb-3">
            Learning path
          </p>
          <h1 className="text-[clamp(1.6rem,3vw,2.2rem)] font-[500] tracking-[-0.03em] text-foreground leading-[1.15]">
            {firstName ? `Welcome back, ${firstName}.` : "Welcome back."}
            <br />
            Pick a tool to learn.
          </h1>
          <p className="mt-4 text-[14px] text-muted-foreground max-w-[520px]">
            Six core DevOps tools, one focused page each — concepts, real commands and a
            practice task you can finish in an afternoon.
          </p>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-border border border-border">
          {tools.map((tool) => (
            <Link
              key={tool.slug}
              to={`/learn/${tool.slug}`}
              className="group relative aspect-square bg-background hover:bg-accent transition-colors p-5 flex flex-col justify-between"
            >
              <div
                className="h-9 w-9 flex items-center justify-center border border-border"
                style={{ color: tool.accent }}
              >
                <tool.icon className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
              </div>

              <div>
                <span className="block text-[10px] uppercase tracking-[0.14em] text-muted-foreground mb-1.5">
                  {tool.category}
                </span>
                <h2 className="text-[15px] font-medium text-foreground">{tool.name}</h2>
                <p className="mt-1 text-[12px] text-muted-foreground leading-[1.5]">
                  {tool.tagline}
                </p>
              </div>

              <ArrowRight className="absolute top-5 right-5 h-3.5 w-3.5 text-muted-foreground opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
            </Link>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
