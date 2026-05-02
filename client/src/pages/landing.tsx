import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Droplets, Phone, Mail, MapPin, Clock, Shirt, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { type Service, type Promo, type ShopSettings, type Feedback } from "@shared/schema";

function buildPhoneHref(phone: string) {
  const digits = phone.replace(/[^0-9+]/g, "");
  return digits ? `tel:${digits}` : "#";
}

export function Landing() {
  const { data: serviceList } = useQuery<Service[]>({ queryKey: ["/api/services"] });
  const { data: promoList } = useQuery<Promo[]>({ queryKey: ["/api/promos"] });
  const { data: settings } = useQuery<ShopSettings>({ queryKey: ["/api/settings"] });
  const { data: feedbackList = [] } = useQuery<Feedback[]>({ queryKey: ["/api/public/feedback"] });
  const activeServices = (serviceList || []).filter((s) => s.active);
  const activePromos = (promoList || []).filter((p) => p.active);
  const publicReviews = feedbackList.filter((f) => f.comment && f.rating >= 4).slice(0, 6);

  const contactInfo = [
    {
      icon: Phone,
      label: "Phone",
      value: settings?.phone || "—",
      href: settings?.phone ? buildPhoneHref(settings.phone) : "#",
    },
    {
      icon: Mail,
      label: "Email",
      value: settings?.email || "—",
      href: settings?.email ? `mailto:${settings.email}` : "#",
    },
    {
      icon: MapPin,
      label: "Address",
      value: settings?.address || "—",
      href: "#",
    },
    {
      icon: Clock,
      label: "Hours",
      value: settings?.hours || "—",
      href: "#",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Droplets className="w-5 h-5" />
            </div>
            <span className="font-display font-bold text-xl text-foreground">Lavanderia Sunrise</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/staff">
              <Button variant="outline" className="rounded-xl" data-testid="link-staff-login">
                Staff Login
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-24 px-6">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/30 rounded-full blur-[100px] -z-10" />
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="font-display text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
            Fresh Clothes,<br />
            <span className="text-primary">Zero Hassle.</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
            Professional laundry services done with care. Drop off your clothes and pick them up clean, fresh, and ready to wear.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/customer/login">
              <Button
                size="lg"
                className="rounded-xl h-13 px-8 shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all"
              >
                Place an Order
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-20 px-6 bg-muted/40">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold text-foreground mb-3">Our Services</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Everything your laundry needs, handled by professionals.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {activeServices.map((svc) => (
              <Card
                key={svc.id}
                className="border border-border/50 rounded-2xl p-6 hover:shadow-md transition-shadow bg-card"
                data-testid={`card-service-${svc.id}`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Shirt className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between gap-4 mb-1">
                      <h3 className="font-display font-semibold text-foreground">{svc.name}</h3>
                      <span className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-lg whitespace-nowrap">₱{Number(svc.pricePerKg).toFixed(0)}/kg</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{svc.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          {activePromos.length > 0 && (
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activePromos.map((promo) => (
                <div key={promo.id} className="border border-green-200 bg-green-50 rounded-2xl px-5 py-4 flex items-center gap-3">
                  <span className="text-lg font-bold text-green-700 bg-green-100 rounded-xl px-3 py-1">{Number(promo.discount).toFixed(0)}% off</span>
                  <div>
                    <p className="font-semibold text-green-900 text-sm">{promo.name}</p>
                    <p className="text-xs text-green-700">{promo.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Testimonials */}
      {publicReviews.length > 0 && (
        <section id="reviews" className="py-20 px-6 bg-muted/40">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl font-bold text-foreground mb-3">What Our Customers Say</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Real feedback from people who trust us with their laundry.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {publicReviews.map((review) => (
                <Card
                  key={review.id}
                  className="border border-border/50 rounded-2xl p-6 bg-card hover:shadow-md transition-shadow"
                  data-testid={`card-review-${review.id}`}
                >
                  <div className="flex gap-0.5 mb-3">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${s <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/20"}`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-foreground leading-relaxed mb-4">"{review.comment}"</p>
                  <div className="flex items-center gap-2 mt-auto">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                      {review.customerName.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-foreground">{review.customerName}</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact */}
      <section id="contact" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold text-foreground mb-3">Get in Touch</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Have questions or want to place a bulk order? Reach out to us anytime.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {contactInfo.map((info) => (
              <a
                key={info.label}
                href={info.href}
                className="group"
                data-testid={`link-contact-${info.label.toLowerCase()}`}
              >
                <Card className="border border-border/50 rounded-2xl p-6 hover:shadow-md hover:border-primary/30 transition-all bg-card h-full">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <info.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">{info.label}</p>
                      <p className="text-sm text-foreground font-medium leading-relaxed">{info.value}</p>
                    </div>
                  </div>
                </Card>
              </a>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
