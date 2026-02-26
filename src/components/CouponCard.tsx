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
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a5" // Smaller, premium ticket size
    });

    // Background Color (Cream/Light Gold)
    doc.setFillColor(252, 250, 242);
    doc.rect(0, 0, 148, 210, "F");

    // Header Border
    doc.setDrawColor(89, 60, 31);
    doc.setLineWidth(1);
    doc.rect(5, 5, 138, 200);

    // Header Banner
    doc.setFillColor(89, 60, 31);
    doc.rect(5, 5, 138, 35, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.text("WAFFLE FIESTA", 74, 22, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("SITAR 2K26 2026 • STALL #17", 74, 30, { align: "center" });

    // Decorative Dividers
    doc.setDrawColor(89, 60, 31);
    doc.setLineWidth(0.5);
    doc.line(20, 50, 128, 50);

    // Coupon Title
    doc.setTextColor(89, 60, 31);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("OFFICIAL VOUCHER", 74, 60, { align: "center" });

    // Coupon ID Area
    doc.setFillColor(243, 234, 215);
    doc.rect(34, 68, 80, 15, "F");
    doc.setDrawColor(89, 60, 31);
    doc.rect(34, 68, 80, 15);

    doc.setFontSize(22);
    doc.text(couponId, 74, 79, { align: "center" });

    // User Details
    doc.setTextColor(50, 40, 30);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");

    const startY = 100;
    doc.text("Customer Details", 25, startY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    doc.text(`Name:`, 25, startY + 10);
    doc.setFont("helvetica", "bold");
    doc.text(`${name}`, 50, startY + 10);

    doc.setFont("helvetica", "normal");
    doc.text(`Phone:`, 25, startY + 18);
    doc.setFont("helvetica", "bold");
    doc.text(`${phone}`, 50, startY + 18);

    doc.setFont("helvetica", "normal");
    doc.text(`Payment:`, 25, startY + 26);
    doc.setFont("helvetica", "bold");
    doc.text(`${paymentType}`, 50, startY + 26);

    doc.setFont("helvetica", "normal");
    doc.text(`Date:`, 25, startY + 34);
    doc.setFont("helvetica", "bold");
    doc.text(`${new Date(createdAt).toLocaleString()}`, 50, startY + 34);

    // QR Code Integration
    const svgElement = document.getElementById(`qr-svg-${couponId}`);
    if (svgElement) {
      const canvas = document.createElement("canvas");
      // Use a higher resolution for the canvas
      canvas.width = 600;
      canvas.height = 600;
      const ctx = canvas.getContext("2d");

      const svgData = new XMLSerializer().serializeToString(svgElement);
      const img = new Image();
      img.onload = () => {
        if (ctx) {
          // Fill white background for QR
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, 600, 600);
          ctx.drawImage(img, 50, 50, 500, 500);

          doc.addImage(canvas.toDataURL("image/png"), "PNG", 51, 145, 45, 45);

          doc.setFont("helvetica", "italic");
          doc.setFontSize(9);
          doc.setTextColor(120, 120, 120);
          doc.text("Please present this voucher for redemption", 74, 195, { align: "center" });
          doc.text("Valid for one-time use only", 74, 200, { align: "center" });

          doc.save(`Waffle_Voucher_${couponId}.pdf`);
        }
      };
      // For cross-origin or complex SVG issues, sometimes it needs to be processed
      img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
    } else {
      // Fallback if QR fails
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text("Please present this voucher for redemption", 74, 195, { align: "center" });
      doc.save(`Waffle_Voucher_${couponId}.pdf`);
    }
  };

  return (
    <div className="relative w-full max-w-sm mx-auto overflow-hidden rounded-2xl border-2 border-secondary bg-card shadow-lg">
      {/* Header */}
      <div className="gradient-waffle p-5 text-center">
        <h2 className="text-2xl font-display font-bold text-primary-foreground">🧇 Waffle Fiesta</h2>
        <p className="text-sm text-primary-foreground/80 mt-1">Stall #17 • SITAR 2K26 2026</p>
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
