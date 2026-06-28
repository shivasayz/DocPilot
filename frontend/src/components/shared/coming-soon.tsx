import { Sparkles, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function ComingSoonCard({
  title,
  description,
  icon: Icon = Sparkles,
}: {
  title: string;
  description: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-dashed border-border bg-surface/30 p-5 transition-all hover:border-foreground/15 hover:bg-surface/50">
      <div className="flex items-start gap-3">
        <div className="grid size-9 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
          <Icon className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium">{title}</h3>
            <Badge variant="outline" className="text-[10px] font-normal">Coming soon</Badge>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
}
