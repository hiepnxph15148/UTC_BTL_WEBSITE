import Link from "next/link";

const columns = [
  {
    title: "Resources",
    links: [
      "Gift Cards",
      "Corporate Sales",
      "Find a Store",
      "Membership",
      "Nike Journal",
      "Site Feedback",
    ],
  },
  {
    title: "Help",
    links: [
      "Get Help",
      "Order Status",
      "Shipping and Delivery",
      "Returns",
      "Order Cancellation",
      "Payment Options",
      "Gift Card Balance",
      "Contact Us",
    ],
  },
  {
    title: "Company",
    links: [
      "About Nike",
      "News",
      "Careers",
      "Investors",
      "Purpose",
      "Sustainability",
      "Accessibility",
    ],
  },
  {
    title: "Promotions & Discounts",
    links: [
      "Student",
      "Military",
      "Teacher",
      "First Responders & Medical Professionals",
      "Birthday",
    ],
  },
] as const;

const legalLinks = [
  "Guides",
  "Terms of Sale",
  "Terms of Use",
  "Nike Privacy Policy",
  "Your Privacy Choices",
  "CA Supply Chains Act",
] as const;

export default function SiteFooter() {
  return (
    <footer className="mt-auto w-full border-t border-white/10 bg-[#121218] text-white">
      <div className="mx-auto w-full max-w-[1200px] px-4 py-10 sm:px-6 md:px-10 lg:px-16 lg:py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-semibold tracking-wide text-white">
                {column.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((label) => (
                  <li key={label}>
                    <Link
                      href={label === "Contact Us" ? "/contact" : "#"}
                      className="text-sm text-white/55 transition-colors hover:text-white"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-4 px-4 py-5 text-xs text-white/55 sm:px-6 md:flex-row md:flex-wrap md:items-center md:justify-between md:px-10 lg:px-16">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <p>© {new Date().getFullYear()} Nike, Inc. All Rights Reserved</p>
            {legalLinks.map((label) => (
              <Link
                key={label}
                href="#"
                className="inline-flex items-center gap-1 transition-colors hover:text-white"
              >
                {label}
                {label === "Guides" ? (
                  <span aria-hidden className="text-[10px]">
                    ▾
                  </span>
                ) : null}
              </Link>
            ))}
          </div>

          <p className="inline-flex items-center gap-2 font-medium text-white">
            <span aria-hidden className="text-base leading-none">
              🌐
            </span>
            United States
          </p>
        </div>
      </div>
    </footer>
  );
}
