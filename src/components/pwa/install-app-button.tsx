import { Download, MonitorSmartphone, Share } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button, type ButtonProps } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePwaInstall } from "@/hooks/use-pwa-install";

export function InstallAppButton({
  variant = "outline",
  size = "sm",
  className = "",
  label = "Install app",
}: Pick<ButtonProps, "variant" | "size"> & { className?: string; label?: string }) {
  const { canInstall, installed, isIos, install } = usePwaInstall();
  const [helpOpen, setHelpOpen] = useState(false);

  if (installed) return null;

  const handleClick = async () => {
    if (canInstall) {
      const accepted = await install();
      if (accepted) {
        toast.success("Samul Bikers installed", {
          description: "Open it from your home screen or app list.",
        });
      }
      return;
    }
    setHelpOpen(true);
  };

  return (
    <>
      <Button type="button" variant={variant} size={size} className={className} onClick={handleClick}>
        <Download aria-hidden="true" className="size-3.5" />
        {label}
      </Button>

      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[15px]">
              <MonitorSmartphone aria-hidden="true" className="size-4 text-primary" />
              Install Samul Bikers
            </DialogTitle>
            <DialogDescription className="text-[11px]">
              Add the POS to your device so it opens like an app, without the browser bar.
            </DialogDescription>
          </DialogHeader>

          <ol className="space-y-3 text-[12px] text-muted-foreground">
            {isIos ? (
              <li className="flex gap-2">
                <Share aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>
                  Tap the <strong className="text-foreground">Share</strong> button in Safari, then choose{" "}
                  <strong className="text-foreground">Add to Home Screen</strong>.
                </span>
              </li>
            ) : (
              <>
                <li>
                  <strong className="text-foreground">Chrome / Edge on Android or desktop:</strong> open the
                  browser menu (⋮) and choose <strong className="text-foreground">Install app</strong> or{" "}
                  <strong className="text-foreground">Add to Home screen</strong>.
                </li>
                <li>
                  <strong className="text-foreground">Safari on iPhone / iPad:</strong> tap Share, then{" "}
                  <strong className="text-foreground">Add to Home Screen</strong>.
                </li>
                <li>On desktop you can also use the install icon in the address bar when it appears.</li>
              </>
            )}
          </ol>

          <DialogFooter>
            <Button type="button" onClick={() => setHelpOpen(false)} className="h-9">
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
