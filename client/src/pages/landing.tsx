import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Droplets, Phone, Mail, MapPin, Clock, Shirt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { type Service, type Promo } from "@shared/schema";

const contactInfo = [
  {
    icon: Phone,
    label: "Phone",
    value: "0955 921 8921",
    href: "tel:+639559218921",
  },
  {
    icon: Mail,
    label: "Email",
    value: "zareenans09@gmail.com",
    href: "mailto:zareenans09@gmail.com",
  },
  {
    icon: MapPin,
    label: "Address",
    value: "Dacanlao, Calaca, Philippines, 4212",
    href: "#",
  },
  {
    icon: Clock,
    label: "Hours",
    value: "Mon–Sat: 7am – 8pm  |  Sun: 9am – 5pm",
    href: "#",
  },
];

export function Landing() {
  const { data: serviceList } = useQuery<Service[]>({ queryKey: ["/api/services"] });
  const { data: promoList } = useQuery<Promo[]>({ queryKey: ["/api/promos"] });
  const activeServices = (serviceList || []).filter((s) => s.active);
  const activePromos = (promoList || []).filter((p) => p.active);

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
            <Link href="/track">
              <Button variant="ghost" className="rounded-xl" data-testid="link-track-order">
                Track Order
              </Button>
            </Link>
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
            <Link href="/order">
              <Button
                size="lg"
                className="rounded-xl h-13 px-8 shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all"
              >
                Place an Order
              </Button>
            </Link>
            <Link href="/track">
              <Button
                size="lg"
                variant="outline"
                className="rounded-xl h-13 px-8 hover:-translate-y-0.5 transition-all"
                data-testid="button-track-order-hero"
              >
                Track My Order
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
