import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WaffleEmoji } from "@/components/WaffleEmoji";
import { CouponCard } from "@/components/CouponCard";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { generateCouponId } from "@/lib/coupon";
import { Link } from "react-router-dom";
import { Shield, Loader2 } from "lucide-react";
import { z } from "zod";
import { QRCodeSVG } from "qrcode.react";

const PRICE = 100;
const UPI_ID = "kothuripujitha713@okicici";

const formSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian phone number"),
  transactionId: z.string().trim().min(1, "Transaction ID is required").max(50, "Transaction ID too long"),
});

export default function Index() {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [coupon, setCoupon] = useState<{
    couponId: string;
    name: string;
    phone: string;
    paymentType: string;
    createdAt: string;
  } | null>(null);

  const handleProceedToPay = () => {
    const parsed = z.object({
      name: formSchema.shape.name,
      phone: formSchema.shape.phone,
    }).safeParse({ name, phone });

    if (!parsed.success) {
      toast({ title: "Validation Error", description: parsed.error.errors[0].message, variant: "destructive" });
      return;
    }
    setShowPayment(true);
  };

  const handleSubmitTransaction = async () => {
    const parsed = formSchema.safeParse({ name, phone, transactionId });
    if (!parsed.success) {
      toast({ title: "Validation Error", description: parsed.error.errors[0].message, variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Check for duplicate transaction ID first (proactive check)
      const { data: existingTxn, error: txnError } = await supabase
        .from("coupons")
        .select("id")
        .eq("transaction_id", parsed.data.transactionId)
        .maybeSingle();

      if (txnError) throw txnError;
      if (existingTxn) {
        throw new Error("This Transaction ID has already been used. Please enter a valid unique Transaction ID.");
      }

      // Generate unique coupon ID
      let couponId = generateCouponId();
      let { data: existing } = await supabase.from("coupons").select("id").eq("coupon_id", couponId).maybeSingle();
      while (existing) {
        couponId = generateCouponId();
        const result = await supabase.from("coupons").select("id").eq("coupon_id", couponId).maybeSingle();
        existing = result.data;
      }

      const { data, error } = await supabase.from("coupons").insert({
        name: parsed.data.name,
        phone: parsed.data.phone,
        coupon_id: couponId,
        payment_type: "Online",
        transaction_id: parsed.data.transactionId,
        verification_status: "Pending",
        status: "Unused",
      }).select().single();

      if (error) {
        if (error.code === "23505" && error.message.includes("transaction_id")) {
          throw new Error("This Transaction ID has already been used. Please enter a valid unique Transaction ID.");
        }
        throw error;
      }

      setCoupon({
        couponId: data.coupon_id,
        name: data.name,
        phone: data.phone,
        paymentType: data.payment_type,
        createdAt: data.created_at,
      });
      toast({ title: "🧇 Coupon Generated!", description: "Your coupon is pending payment verification by admin." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Something went wrong", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (coupon) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <CouponCard {...coupon} />
        <p className="mt-4 text-sm text-muted-foreground text-center max-w-sm">
          ⏳ Your payment is pending verification. The coupon will be valid once admin verifies your UPI payment.
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => {
            setCoupon(null);
            setName("");
            setPhone("");
            setTransactionId("");
            setShowPayment(false);
          }}
        >
          Buy Another Coupon
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 waffle-pattern pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <WaffleEmoji className="text-5xl" />
            <h1 className="text-5xl md:text-6xl font-display font-black text-gradient-gold">
              Waffle Fiesta
            </h1>
            <WaffleEmoji className="text-5xl" />
          </div>
          <p className="text-lg text-muted-foreground font-medium mt-2">
            College Fest 2026 • Stall #17
          </p>
          <div className="mt-4 inline-block gradient-gold text-accent-foreground px-6 py-2 rounded-full font-bold text-xl shadow-md animate-pulse-glow">
            ₹{PRICE} per Waffle
          </div>
        </div>

        {/* Purchase Card */}
        <div className="w-full max-w-md bg-card rounded-2xl shadow-xl border-2 border-secondary/50 p-6 space-y-5">
          {!showPayment ? (
            <>
              <h2 className="text-xl font-display font-bold text-center">Get Your Coupon 🎫</h2>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="name">Your Name</Label>
                  <Input id="name" placeholder="e.g. Rahul Sharma" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" placeholder="e.g. 9876543210" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} maxLength={10} type="tel" />
                </div>
              </div>
              <Button onClick={handleProceedToPay} className="w-full text-lg font-bold h-12 gradient-waffle hover:opacity-90 transition-opacity text-primary-foreground" size="lg">
                🧇 Proceed to Pay — ₹{PRICE}
              </Button>
            </>
          ) : (
            <>
              <h2 className="text-xl font-display font-bold text-center">Pay via UPI 💳</h2>

              <div className="flex flex-col items-center space-y-4">
                <a
                  href={`upi://pay?pa=${UPI_ID}&pn=WaffleFiesta&am=${PRICE}&cu=INR`}
                  className="bg-white rounded-xl p-6 shadow-md border-2 border-primary/20 hover:border-primary/40 transition-colors cursor-pointer"
                  title="Click to pay via UPI app"
                >
                  <QRCodeSVG
                    value={`upi://pay?pa=${UPI_ID}&pn=WaffleFiesta&am=${PRICE}&cu=INR`}
                    size={224}
                    level="H"
                    includeMargin={true}
                  />
                </a>

                <div className="flex flex-col items-center gap-2 w-full">
                  <p className="text-sm text-muted-foreground">Scan QR or tap below to pay</p>
                  <Button
                    variant="outline"
                    className="w-full h-11 border-primary/20 hover:bg-primary/5 text-primary font-bold md:hidden"
                    onClick={() => window.location.href = `upi://pay?pa=${UPI_ID}&pn=WaffleFiesta&am=${PRICE}&cu=INR`}
                  >
                    📲 Pay via UPI App
                  </Button>
                </div>

                <div className="bg-muted rounded-lg px-4 py-2 text-center w-full">
                  <p className="text-xs text-muted-foreground">UPI ID</p>
                  <p className="font-mono font-bold text-sm text-foreground">{UPI_ID}</p>
                </div>
                <div className="bg-primary/10 rounded-lg px-4 py-2 text-center w-full">
                  <p className="text-xs text-muted-foreground">Amount</p>
                  <p className="font-bold text-lg text-primary">₹{PRICE}</p>
                </div>
              </div>

              {/* Transaction ID */}
              <div className="space-y-2 pt-2 border-t">
                <Label htmlFor="txn">UPI Transaction ID</Label>
                <Input
                  id="txn"
                  placeholder="e.g. T2601241234567890"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value.trim())}
                  maxLength={50}
                />
                <p className="text-xs text-muted-foreground">Enter the transaction ID from your UPI app after payment</p>
              </div>

              <Button
                onClick={handleSubmitTransaction}
                disabled={loading}
                className="w-full text-lg font-bold h-12 gradient-waffle hover:opacity-90 transition-opacity text-primary-foreground"
                size="lg"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "🧇"}
                {loading ? "Generating Coupon..." : "Submit & Get Coupon"}
              </Button>

              <Button variant="ghost" className="w-full" onClick={() => setShowPayment(false)}>
                ← Back
              </Button>
            </>
          )}

          <p className="text-xs text-center text-muted-foreground">
            Pay via UPI. Coupon valid after admin verification.
          </p>
        </div>

        <Link to="/admin" className="mt-8 flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
          <Shield className="w-4 h-4" /> Admin Dashboard
        </Link>
      </div>
    </div>
  );
}
