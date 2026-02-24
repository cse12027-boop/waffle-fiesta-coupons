import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WaffleEmoji } from "@/components/WaffleEmoji";
import { CouponCard } from "@/components/CouponCard";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Shield, Loader2 } from "lucide-react";
import { z } from "zod";

const PRICE = 50;

const formSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian phone number"),
});

export default function Index() {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [coupon, setCoupon] = useState<{
    couponId: string;
    name: string;
    phone: string;
    paymentType: string;
    createdAt: string;
  } | null>(null);

  const handleBuy = async () => {
    const parsed = formSchema.safeParse({ name, phone });
    if (!parsed.success) {
      toast({ title: "Validation Error", description: parsed.error.errors[0].message, variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Create Razorpay order via edge function
      const { data, error } = await supabase.functions.invoke("create-razorpay-order", {
        body: { amount: PRICE, name: parsed.data.name, phone: parsed.data.phone },
      });

      if (error || !data?.orderId) {
        throw new Error(error?.message || "Failed to create order");
      }

      // Open Razorpay checkout
      const options = {
        key: data.razorpayKeyId,
        amount: PRICE * 100,
        currency: "INR",
        name: "Waffle Fiesta",
        description: "Waffle Coupon",
        order_id: data.orderId,
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          try {
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke("verify-razorpay-payment", {
              body: {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                name: parsed.data.name,
                phone: parsed.data.phone,
              },
            });

            if (verifyError || !verifyData?.coupon) {
              throw new Error("Payment verification failed");
            }

            setCoupon(verifyData.coupon);
            toast({ title: "🧇 Coupon Generated!", description: "Your waffle coupon is ready!" });
          } catch {
            toast({ title: "Error", description: "Payment verification failed. Contact support.", variant: "destructive" });
          }
        },
        prefill: { name: parsed.data.name, contact: parsed.data.phone },
        theme: { color: "#7A4419" },
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.on("payment.failed", () => {
        toast({ title: "Payment Failed", description: "Your payment was not successful. Please try again.", variant: "destructive" });
      });
      razorpay.open();
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
        <Button
          variant="outline"
          className="mt-6"
          onClick={() => {
            setCoupon(null);
            setName("");
            setPhone("");
          }}
        >
          Buy Another Coupon
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Waffle pattern overlay */}
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
            College Fest 2026 • Stall #7
          </p>
          <div className="mt-4 inline-block gradient-gold text-accent-foreground px-6 py-2 rounded-full font-bold text-xl shadow-md animate-pulse-glow">
            ₹{PRICE} per Waffle
          </div>
        </div>

        {/* Purchase Card */}
        <div className="w-full max-w-md bg-card rounded-2xl shadow-xl border-2 border-secondary/50 p-6 space-y-5">
          <h2 className="text-xl font-display font-bold text-center">Get Your Coupon 🎫</h2>

          <div className="space-y-3">
            <div>
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                placeholder="e.g. Rahul Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                placeholder="e.g. 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                maxLength={10}
                type="tel"
              />
            </div>
          </div>

          <Button
            onClick={handleBuy}
            disabled={loading}
            className="w-full text-lg font-bold h-12 gradient-waffle hover:opacity-90 transition-opacity text-primary-foreground"
            size="lg"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              "🧇"
            )}
            {loading ? "Processing..." : `Buy Coupon — ₹${PRICE}`}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Secure payment via Razorpay. Coupon generated instantly.
          </p>
        </div>

        {/* Admin Link */}
        <Link
          to="/admin"
          className="mt-8 flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <Shield className="w-4 h-4" />
          Admin Dashboard
        </Link>
      </div>
    </div>
  );
}
