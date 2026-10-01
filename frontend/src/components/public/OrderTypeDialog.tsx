import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { UtensilsCrossed, ShoppingBag } from "lucide-react";

interface OrderTypeDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectType: (type: "DINE_IN" | "TAKEAWAY") => void;
}

export default function OrderTypeDialog({
  open,
  onClose,
  onSelectType,
}: OrderTypeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            Select Order Type
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <Button
            onClick={() => onSelectType("DINE_IN")}
            className="h-32 flex flex-col gap-3 bg-gradient-to-br from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
          >
            <UtensilsCrossed className="w-12 h-12" />
            <span className="text-lg font-semibold">Dine In</span>
          </Button>
          <Button
            onClick={() => onSelectType("TAKEAWAY")}
            className="h-32 flex flex-col gap-3 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
          >
            <ShoppingBag className="w-12 h-12" />
            <span className="text-lg font-semibold">Takeaway</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
