"use client";

import useEmblaCarousel from "embla-carousel-react";
import { WheelGesturesPlugin } from "embla-carousel-wheel-gestures";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles, PenLine, GripHorizontal } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Template = {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  thumbnailUrl: string;
  atsSafe: boolean;
};

/**
 * Original carousel geometry (from first working gallery):
 * slide width → letter aspect [8.5/11] → full page visible, never max-h cropped.
 */
export function TemplateGallery() {
  const router = useRouter();
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["templates"],
    queryFn: async () => {
      const res = await fetch("/api/templates");
      const data = await res.json();
      return Array.isArray(data) ? (data as Template[]) : [];
    },
  });

  const plugins = useMemo(() => [WheelGesturesPlugin({ forceWheelAxis: "x" })], []);
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: "center",
      skipSnaps: false,
      dragFree: false,
      containScroll: false,
      duration: 22,
      watchDrag: true,
    },
    plugins,
  );

  const [selected, setSelected] = useState(0);
  const [active, setActive] = useState<Template | null>(null);
  const dragMoved = useRef(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelected(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    emblaApi.on("pointerDown", () => {
      dragMoved.current = false;
    });
    emblaApi.on("scroll", () => {
      dragMoved.current = true;
    });
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") emblaApi?.scrollNext();
      if (event.key === "ArrowLeft") emblaApi?.scrollPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [emblaApi]);

  const current = templates[selected];

  return (
    <div className="relative min-h-[calc(100vh-56px)] overflow-x-hidden bg-background text-foreground">
      <div className="surface-grid pointer-events-none absolute inset-0 opacity-50" />

      <div className="relative mx-auto max-w-[1400px] px-4 pb-10 pt-8">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
              Real LaTeX templates
            </p>
            <h1 className="mt-2 font-display text-3xl tracking-tight md:text-4xl">
              Swipe a resume. Use that design.
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground md:text-base">
              Drag · scroll · arrows. Edit opens that resume’s fields already filled — change them on the right.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground sm:flex">
              <GripHorizontal className="h-3.5 w-3.5" />
              Drag · scroll · ← →
            </div>
            <Button variant="secondary" size="icon" onClick={() => emblaApi?.scrollPrev()} aria-label="Previous">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="secondary" size="icon" onClick={() => emblaApi?.scrollNext()} aria-label="Next">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {isLoading && (
          <div className="flex justify-center py-24 text-muted-foreground">Loading templates…</div>
        )}

        {/* No fixed viewport height — letter aspect comes from slide width (original working geometry). */}
        <div
          className="cursor-grab overflow-hidden active:cursor-grabbing"
          ref={emblaRef}
          style={{ touchAction: "pan-y" }}
        >
          <div className="flex touch-pan-y">
            {templates.map((template, index) => {
              const isCenter = selected === index;
              return (
                <div
                  key={template.id}
                  className="min-w-0 shrink-0 grow-0 basis-[88%] px-3 sm:basis-[70%] md:basis-[52%] lg:basis-[42%] xl:basis-[36%]"
                >
                  <motion.button
                    type="button"
                    layoutId={`card-${template.id}`}
                    onClick={() => {
                      if (dragMoved.current) return;
                      if (!isCenter) {
                        emblaApi?.scrollTo(index);
                        return;
                      }
                      setActive(template);
                    }}
                    className={cn(
                      "group w-full text-left transition-[transform,opacity,filter] duration-300",
                      isCenter ? "scale-100 opacity-100" : "scale-[0.88] opacity-45 hover:opacity-70",
                    )}
                    style={{ transformOrigin: "center center" }}
                  >
                    {/* Full letter page: width drives height — nothing cropped top/bottom */}
                    <div
                      className={cn(
                        "relative aspect-[8.5/11] w-full overflow-hidden rounded-sm border border-border bg-white",
                        isCenter && "ring-1 ring-border",
                      )}
                      style={{
                        boxShadow: isCenter
                          ? "0 1px 0 rgba(255,255,255,0.5) inset, 0 40px 80px -40px rgba(0,0,0,0.55), 0 12px 24px -12px rgba(0,0,0,0.35)"
                          : "0 12px 28px -20px rgba(0,0,0,0.25)",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={template.thumbnailUrl}
                        alt={`${template.name} real resume sample`}
                        className="absolute inset-0 h-full w-full object-contain object-center"
                        draggable={false}
                      />
                    </div>
                    <div
                      className={cn(
                        "mt-5 flex items-start justify-between gap-3 transition-opacity",
                        isCenter ? "opacity-100" : "opacity-0",
                      )}
                    >
                      <div>
                        <div className="font-display text-2xl tracking-tight">{template.name}</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {template.atsSafe && <Badge variant="accent">ATS-Safe</Badge>}
                          <Badge variant="outline">{template.category}</Badge>
                        </div>
                      </div>
                      <div className="pt-1 text-xs text-muted-foreground">Click for options</div>
                    </div>
                  </motion.button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center gap-4">
          <div className="flex items-center gap-1.5">
            {templates.map((t, i) => (
              <button
                key={t.id}
                aria-label={`Go to ${t.name}`}
                onClick={() => emblaApi?.scrollTo(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === selected ? "w-6 bg-accent" : "w-1.5 bg-muted hover:bg-muted-foreground/40",
                )}
              />
            ))}
          </div>
          {current && (
            <div className="flex flex-wrap justify-center gap-3">
              <Button
                size="lg"
                onClick={() =>
                  router.push(`/editor/new?templateId=${encodeURIComponent(current.id)}&mode=manual`)
                }
              >
                <PenLine className="h-4 w-4" /> Use {current.name}
              </Button>
              <Button size="lg" variant="secondary" onClick={() => router.push(`/match/${current.id}`)}>
                <Sparkles className="h-4 w-4" /> Build with AI
              </Button>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {active && (
          <Dialog open onOpenChange={() => setActive(null)}>
            <DialogContent className="border-border bg-card p-0">
              <div className="grid gap-0 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                <motion.div layoutId={`card-${active.id}`} className="bg-desk p-4 sm:p-6 lg:p-8">
                  <div className="mx-auto w-full max-w-[480px]">
                    <div className="relative aspect-[8.5/11] w-full overflow-hidden rounded-sm border border-border bg-white shadow-lg">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={active.thumbnailUrl}
                        alt={`${active.name} real resume sample`}
                        className="absolute inset-0 h-full w-full object-contain object-center"
                      />
                    </div>
                  </div>
                </motion.div>
                <div className="flex flex-col justify-between gap-6 border-t border-border p-5 sm:p-7 lg:border-l lg:border-t-0 lg:p-9">
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Real template</p>
                    <DialogTitle className="mt-2 break-words font-display text-2xl tracking-tight sm:text-3xl md:text-4xl">
                      {active.name}
                    </DialogTitle>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge variant="accent">ATS-Safe · single column</Badge>
                      <Badge variant="outline">{active.category}</Badge>
                    </div>
                    <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:mt-5 sm:text-[15px]">
                      {active.description}
                    </p>
                    <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
                      <li>• Full real sample — scroll if needed on small screens</li>
                      <li>• Edit opens with this resume’s fields already filled</li>
                      <li>• Live preview updates as you type; PDF when TeX is available</li>
                    </ul>
                  </div>
                  <div className="grid gap-3 pb-1">
                    <Button
                      size="lg"
                      className="w-full"
                      onClick={() => {
                        setActive(null);
                        router.push(`/editor/new?templateId=${encodeURIComponent(active.id)}&mode=manual`);
                      }}
                    >
                      <PenLine className="h-4 w-4" /> Use this template
                    </Button>
                    <Button
                      size="lg"
                      variant="secondary"
                      className="w-full"
                      onClick={() => {
                        setActive(null);
                        router.push(`/match/${active.id}`);
                      }}
                    >
                      <Sparkles className="h-4 w-4" /> Build with AI
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
}
