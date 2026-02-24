import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Download, Check } from "lucide-react";
import jsPDF from "jspdf";

interface CouponCardProps {
  couponId: string;
  name: string;
  phone: string;
  paymentType: string;
  createdAt: string;
}

export function CouponCard({ couponId, name, phone, paymentType, createdAt }: CouponCardProps) {
  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(89, 60, 31);
    doc.rect(0, 0, 210, 50, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.text("WAFFLE FIESTA", 105, 25, { align: "center" });
    doc.setFontSize(12);
    doc.text("Stall #7 | College Fest 2026", 105, 38, { align: "center" });
    
    // Coupon details
    doc.setTextColor(50, 40, 30);
    doc.setFontSize(16);
    doc.text("WAFFLE COUPON", 105, 65, { align: "center" });
    
    doc.setFontSize(22);
    doc.setTextColor(89, 60, 31);
    doc.text(couponId, 105, 80, { align: "center" });
    
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    doc.text(`Name: ${name}`, 30, 100);
    doc.text(`Phone: ${phone}`, 30, 110);
    doc.text(`Payment: ${paymentType}`, 30, 120);
    doc.text(`Date: ${new Date(createdAt).toLocaleString()}`, 30, 130);
    
    // QR Code
    const qrCanvas = document.getElementById(`qr-${couponId}`) as HTMLCanvasElement | null;
    if (qrCanvas) {
      const svgElement = document.getElementById(`qr-svg-${couponId}`);
      if (svgElement) {
        const canvas = document.createElement("canvas");
        canvas.width = 200;
        canvas.height = 200;
        const ctx = canvas.getContext("2d");
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const img = new Image();
        img.onload = () => {
          ctx?.drawImage(img, 0, 0, 200, 200);
          doc.addImage(canvas.toDataURL("image/png"), "PNG", 65, 140, 80, 80);
          doc.setFontSize(9);
          doc.setTextColor(150, 150, 150);
          doc.text("Present this coupon at the stall to redeem your waffle", 105, 230, { align: "center" });
          doc.save(`Waffle-Coupon-${couponId}.pdf`);
        };
        img.src = "data:image/svg+xml;base64," + btoa(svgData);
      }
    } else {
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text("Present this coupon at the stall to redeem your waffle", 105, 230, { align: "center" });
      doc.save(`Waffle-Coupon-${couponId}.pdf`);
    }
  };

  return (
    <div className="relative w-full max-w-sm mx-auto overflow-hidden rounded-2xl border-2 border-secondary bg-card shadow-lg">
      {/* Header */}
      <div className="gradient-waffle p-5 text-center">
        <h2 className="text-2xl font-display font-bold text-primary-foreground">🧇 Waffle Fiesta</h2>
        <p className="text-sm text-primary-foreground/80 mt-1">Stall #7 • College Fest 2026</p>
      </div>

      {/* Dashed separator */}
      <div className="border-t-2 border-dashed border-secondary" />

      {/* Body */}
      <div className="p-5 space-y-4">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Coupon ID</p>
          <p className="text-2xl font-display font-bold text-primary mt-1">{couponId}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Name</p>
            <p className="font-medium truncate">{name}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Phone</p>
            <p className="font-medium">{phone}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Payment</p>
            <p className="font-medium">{paymentType}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Date</p>
            <p className="font-medium">{new Date(createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center gap-3 pt-2">
          <div className="bg-background p-3 rounded-xl border">
            <QRCodeSVG
              id={`qr-svg-${couponId}`}
              value={JSON.stringify({ couponId })}
              size={150}
              level="H"
              includeMargin
            />
          </div>
          <p className="text-xs text-muted-foreground text-center">Scan this QR code at the stall</p>
        </div>

        <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 border border-success/20">
          <Check className="w-4 h-4 text-success" />
          <span className="text-sm font-medium text-success">Valid Coupon — Unused</span>
        </div>

        <Button onClick={handleDownloadPDF} className="w-full gap-2">
          <Download className="w-4 h-4" />
          Download as PDF
        </Button>
      </div>
    </div>
  );
}
