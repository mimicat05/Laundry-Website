import { Link } from "wouter";
import { Droplets, Phone, Mail, MapPin, Clock, Shirt, Sparkles, ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const services = [
  {
    icon: Shirt,
    title: "Wash & Hang",
    description: "We wash and hang your clothes so they come back fresh and ready to wear.",
    price: "₱30/kg",
  },
  {
    icon: Sparkles,
    title: "Dry-cleaning",
    description: "Professional dry cleaning for delicate fabrics, suits, and formal wear.",
    price: "₱60/kg",
  },
];

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
          <Link href="/staff">
            <Button variant="outline" className="rounded-xl gap-2" data-testid="link-staff-login">
              Staff Login
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-24 px-6">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/30 rounded-full blur-[100px] -z-10" />
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <Star className="w-3.5 h-3.5 fill-primary" />
            Trusted by hundreds of happy customers
          </div>
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
                className="rounded-xl h-13 px-8 gap-2 shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all"
              >
                Place an Order
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="rounded-xl h-13 px-8 gap-2"
              data-testid="button-contact-us"
              onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
            >
              Contact Us
            </Button>
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
            {services.map((service) => (
              <Card
                key={service.title}
                className="border border-border/50 rounded-2xl p-6 hover:shadow-md transition-shadow bg-card"
                data-testid={`card-service-${service.title.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <service.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between gap-4 mb-1">
                      <h3 className="font-display font-semibold text-foreground">{service.title}</h3>
                      <span className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-lg whitespace-nowrap">{service.price}</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{service.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
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
