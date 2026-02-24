import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { CouponCard } from "@/components/CouponCard";
import { generateCouponId } from "@/lib/coupon";
import { QrScanner } from "@/components/QrScanner";
import {
  LogOut, Search, QrCode, Plus, BarChart3, Ticket, CheckCircle, CreditCard, Banknote, Loader2, X, ScanLine, ShieldCheck, Clock
} from "lucide-react";

type Coupon = {
  id: string;
  name: string;
  phone: string;
  coupon_id: string;
  payment_id: string | null;
  payment_type: "Online" | "Cash";
  status: "Unused" | "Redeemed";
  verification_status: "Pending" | "Verified";
  transaction_id: string | null;
  redeemed_at: string | null;
  created_at: string;
};

type FilterType = "all" | "Unused" | "Redeemed" | "Online" | "Cash" | "Pending" | "Verified";

export default function AdminDashboard() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [showManual, setShowManual] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [manualLoading, setManualLoading] = useState(false);
  const [manualCoupon, setManualCoupon] = useState<Coupon | null>(null);
  const [scanResult, setScanResult] = useState<{ coupon: Coupon | null; message: string; valid: boolean } | null>(null);

  const fetchCoupons = useCallback(async () => {
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error", description: "Failed to load coupons", variant: "destructive" });
      return;
    }
    setCoupons((data as Coupon[]) || []);
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin");
  };

  const handleManualGenerate = async () => {
    if (!manualName.trim() || !manualPhone.trim()) {
      toast({ title: "Error", description: "Name and phone are required", variant: "destructive" });
      return;
    }
    if (!/^[6-9]\d{9}$/.test(manualPhone.trim())) {
      toast({ title: "Error", description: "Enter a valid 10-digit phone number", variant: "destructive" });
      return;
    }

    setManualLoading(true);
    try {
      let couponId = generateCouponId();
      let { data: existing } = await supabase.from("coupons").select("id").eq("coupon_id", couponId).maybeSingle();
      while (existing) {
        couponId = generateCouponId();
        const result = await supabase.from("coupons").select("id").eq("coupon_id", couponId).maybeSingle();
        existing = result.data;
      }

      const { data, error } = await supabase.from("coupons").insert({
        name: manualName.trim(),
        phone: manualPhone.trim(),
        coupon_id: couponId,
        payment_type: "Cash",
        verification_status: "Verified",
        status: "Unused",
      }).select().single();

      if (error) throw error;
      setManualCoupon(data as Coupon);
      toast({ title: "Coupon Generated!", description: `Coupon ${couponId} created` });
      fetchCoupons();
      setManualName("");
      setManualPhone("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setManualLoading(false);
    }
  };

  const handleScanResult = async (scannedText: string) => {
    setShowScanner(false);
    try {
      const parsed = JSON.parse(scannedText);
      const couponId = parsed.couponId;
      if (!couponId) throw new Error("Invalid QR");

      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("coupon_id", couponId)
        .maybeSingle();

      if (error || !data) {
        setScanResult({ coupon: null, message: "Coupon not found", valid: false });
        return;
      }

      const c = data as Coupon;
      if (c.verification_status === "Pending") {
        setScanResult({ coupon: c, message: "Payment NOT verified yet!", valid: false });
      } else if (c.status === "Redeemed") {
        setScanResult({ coupon: c, message: "Already Redeemed!", valid: false });
      } else {
        setScanResult({ coupon: c, message: "Valid — Verified & Unused", valid: true });
      }
    } catch {
      setScanResult({ coupon: null, message: "Invalid QR Code", valid: false });
    }
  };

  const handleRedeem = async (couponId: string) => {
    const { error } = await supabase
      .from("coupons")
      .update({ status: "Redeemed", redeemed_at: new Date().toISOString() })
      .eq("coupon_id", couponId);

    if (error) {
      toast({ title: "Error", description: "Failed to redeem", variant: "destructive" });
      return;
    }
    toast({ title: "✅ Redeemed!", description: `Coupon ${couponId} marked as redeemed` });
    setScanResult(null);
    fetchCoupons();
  };

  const handleVerify = async (couponId: string) => {
    const { error } = await supabase
      .from("coupons")
      .update({ verification_status: "Verified" })
      .eq("coupon_id", couponId);

    if (error) {
      toast({ title: "Error", description: "Failed to verify", variant: "destructive" });
      return;
    }
    toast({ title: "✅ Verified!", description: `Payment for ${couponId} verified` });
    fetchCoupons();
  };

  const filtered = coupons.filter((c) => {
    if (search && !c.coupon_id.toLowerCase().includes(search.toLowerCase()) && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === "Unused" && c.status !== "Unused") return false;
    if (filter === "Redeemed" && c.status !== "Redeemed") return false;
    if (filter === "Online" && c.payment_type !== "Online") return false;
    if (filter === "Cash" && c.payment_type !== "Cash") return false;
    if (filter === "Pending" && c.verification_status !== "Pending") return false;
    if (filter === "Verified" && c.verification_status !== "Verified") return false;
    return true;
  });

  const stats = {
    total: coupons.length,
    redeemed: coupons.filter((c) => c.status === "Redeemed").length,
    online: coupons.filter((c) => c.payment_type === "Online").length,
    cash: coupons.filter((c) => c.payment_type === "Cash").length,
    pending: coupons.filter((c) => c.verification_status === "Pending").length,
  };

  const filterButtons: { label: string; value: FilterType; icon: typeof Ticket }[] = [
    { label: "All", value: "all", icon: Ticket },
    { label: "Pending", value: "Pending", icon: Clock },
    { label: "Verified", value: "Verified", icon: ShieldCheck },
    { label: "Unused", value: "Unused", icon: Ticket },
    { label: "Redeemed", value: "Redeemed", icon: CheckCircle },
    { label: "Online", value: "Online", icon: CreditCard },
    { label: "Cash", value: "Cash", icon: Banknote },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="gradient-waffle text-primary-foreground p-4 sticky top-0 z-50 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-display font-bold">🧇 Waffle Fiesta Admin</h1>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-primary-foreground hover:bg-primary-foreground/10">
            <LogOut className="w-4 h-4 mr-1" /> Logout
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Total Coupons", value: stats.total, icon: BarChart3, color: "bg-primary/10 text-primary" },
            { label: "Pending", value: stats.pending, icon: Clock, color: "bg-warning/10 text-warning-foreground" },
            { label: "Redeemed", value: stats.redeemed, icon: CheckCircle, color: "bg-success/10 text-success" },
            { label: "Online (UPI)", value: stats.online, icon: CreditCard, color: "bg-accent/20 text-accent-foreground" },
            { label: "Cash", value: stats.cash, icon: Banknote, color: "bg-secondary/50 text-secondary-foreground" },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl p-4 ${s.color} border`}>
              <s.icon className="w-5 h-5 mb-1" />
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs opacity-80">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => { setShowScanner(true); setScanResult(null); }} className="gradient-waffle text-primary-foreground gap-2">
            <ScanLine className="w-4 h-4" /> Scan QR
          </Button>
          <Button onClick={() => { setShowManual(!showManual); setManualCoupon(null); }} variant="outline" className="gap-2">
            <Plus className="w-4 h-4" /> Manual Coupon
          </Button>
        </div>

        {/* QR Scanner */}
        {showScanner && (
          <div className="bg-card border rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold flex items-center gap-2"><QrCode className="w-5 h-5" /> QR Scanner</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowScanner(false)}><X className="w-4 h-4" /></Button>
            </div>
            <QrScanner onResult={handleScanResult} />
          </div>
        )}

        {/* Scan Result */}
        {scanResult && (
          <div className={`border-2 rounded-xl p-5 ${scanResult.valid ? "border-success bg-success/5" : "border-destructive bg-destructive/5"}`}>
            <div className="flex items-center gap-3 mb-3">
              {scanResult.valid ? <CheckCircle className="w-8 h-8 text-success" /> : <X className="w-8 h-8 text-destructive" />}
              <div>
                <p className="text-lg font-bold">{scanResult.valid ? "✅ Valid" : "❌ Invalid"}</p>
                <p className="text-sm text-muted-foreground">{scanResult.message}</p>
              </div>
            </div>
            {scanResult.coupon && (
              <div className="space-y-2 text-sm">
                <p><strong>Coupon:</strong> {scanResult.coupon.coupon_id}</p>
                <p><strong>Name:</strong> {scanResult.coupon.name}</p>
                <p><strong>Phone:</strong> {scanResult.coupon.phone}</p>
                <p><strong>Type:</strong> {scanResult.coupon.payment_type}</p>
                <p><strong>Verification:</strong> {scanResult.coupon.verification_status}</p>
                {scanResult.coupon.transaction_id && <p><strong>Txn ID:</strong> {scanResult.coupon.transaction_id}</p>}
                {scanResult.valid && (
                  <Button onClick={() => handleRedeem(scanResult.coupon!.coupon_id)} className="mt-3 bg-success hover:bg-success/90 text-success-foreground">
                    Mark as Redeemed
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Manual Coupon Form */}
        {showManual && (
          <div className="bg-card border rounded-xl p-5 space-y-4">
            <h3 className="font-display font-bold">Generate Cash Coupon</h3>
            {manualCoupon ? (
              <div>
                <CouponCard couponId={manualCoupon.coupon_id} name={manualCoupon.name} phone={manualCoupon.phone} paymentType={manualCoupon.payment_type} createdAt={manualCoupon.created_at} />
                <Button variant="outline" className="mt-4 w-full" onClick={() => setManualCoupon(null)}>Generate Another</Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <Label>Customer Name</Label>
                  <Input value={manualName} onChange={(e) => setManualName(e.target.value)} placeholder="e.g. Priya Singh" maxLength={100} />
                </div>
                <div>
                  <Label>Phone Number</Label>
                  <Input value={manualPhone} onChange={(e) => setManualPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="e.g. 9876543210" maxLength={10} type="tel" />
                </div>
                <Button onClick={handleManualGenerate} disabled={manualLoading} className="w-full gradient-waffle text-primary-foreground">
                  {manualLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Generate Coupon (Cash)
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Filters & Search */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search by Coupon ID or name..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-2">
            {filterButtons.map((f) => (
              <Button key={f.value} variant={filter === f.value ? "default" : "outline"} size="sm" onClick={() => setFilter(f.value)} className="gap-1">
                <f.icon className="w-3 h-3" /> {f.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Coupon List */}
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Ticket className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No coupons found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="p-3">Coupon ID</th>
                  <th className="p-3">Name</th>
                  <th className="p-3 hidden md:table-cell">Phone</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Verified</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 hidden md:table-cell">Txn ID</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="p-3 font-mono font-bold text-primary">{c.coupon_id}</td>
                    <td className="p-3">{c.name}</td>
                    <td className="p-3 hidden md:table-cell">{c.phone}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.payment_type === "Online" ? "bg-accent/20 text-accent-foreground" : "bg-secondary text-secondary-foreground"}`}>
                        {c.payment_type === "Online" ? "UPI" : "Cash"}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.verification_status === "Verified" ? "bg-success/10 text-success" : "bg-warning/10 text-warning-foreground"}`}>
                        {c.verification_status}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.status === "Unused" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="p-3 hidden md:table-cell font-mono text-xs text-muted-foreground">{c.transaction_id || "—"}</td>
                    <td className="p-3 space-x-1">
                      {c.verification_status === "Pending" && (
                        <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => handleVerify(c.coupon_id)}>
                          <ShieldCheck className="w-3 h-3" /> Verify
                        </Button>
                      )}
                      {c.verification_status === "Verified" && c.status === "Unused" && (
                        <Button size="sm" variant="outline" className="text-xs gap-1 text-success" onClick={() => handleRedeem(c.coupon_id)}>
                          <CheckCircle className="w-3 h-3" /> Redeem
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
