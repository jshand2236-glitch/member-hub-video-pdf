import Image from "next/image";
import { INSTRUCTORS } from "@/data/instructors";

export const metadata = {
  title: "講師紹介 | AAM Fukuoka",
};

export default function InstructorsPage() {
  return (
    <>
      <section className="bg-[linear-gradient(100deg,#091326_0%,#0e1b34_52%,#16264a_100%)]">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20">
          <span className="eyebrow eyebrow-light">Instructors</span>
          <h1 className="mt-3 font-serif text-2xl font-semibold text-white sm:text-3xl">
            講師紹介
          </h1>
          <p className="mt-4 text-sm leading-loose text-white/75">
            会員限定動画は、この3名の講師が持ち回りで配信しています。
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="space-y-16">
          {INSTRUCTORS.map((instructor, index) => (
            <section
              key={instructor.slug}
              id={instructor.slug}
              className="scroll-mt-24 border-t border-line pt-14 first:border-t-0 first:pt-0"
            >
              <div className="grid gap-8 sm:grid-cols-[minmax(0,260px)_1fr] sm:gap-10">
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-soft">
                  <Image
                    src={instructor.photo}
                    alt={`${instructor.name}さんの写真`}
                    fill
                    sizes="(max-width: 640px) 100vw, 260px"
                    className="object-cover"
                    priority={index === 0}
                  />
                </div>

                <div>
                  <span className="eyebrow">
                    {String(index + 1).padStart(2, "0")} — {instructor.role}
                  </span>
                  <h2 className="mt-2 font-serif text-2xl font-semibold">{instructor.name}</h2>
                  <p className="mt-0.5 font-sans text-[11px] tracking-[0.28em] text-muted">
                    {instructor.nameReading}
                  </p>

                  <p className="mt-5 text-sm font-medium">{instructor.title}</p>
                  <p className="mt-1 text-sm text-muted">
                    {instructor.qualifications.join("・")}
                    {instructor.specialty && (
                      <span> ／ 専門：{instructor.specialty}</span>
                    )}
                  </p>

                  <p className="mt-5 text-sm leading-loose text-muted">{instructor.bio}</p>

                  <div className="mt-6">
                    <h3 className="eyebrow">Career</h3>
                    <ul className="mt-3 space-y-2 text-sm text-muted">
                      {instructor.career.map((item) => (
                        <li key={item} className="flex items-start gap-2.5">
                          <span
                            className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                            aria-hidden="true"
                          />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
