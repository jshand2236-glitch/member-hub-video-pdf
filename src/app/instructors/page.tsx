import { INSTRUCTORS } from "@/data/instructors";

export const metadata = {
  title: "講師紹介 | AAM Fukuoka",
};

export default function InstructorsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <span className="eyebrow">Instructors</span>
      <h1 className="mt-2 font-serif text-2xl font-semibold sm:text-3xl">講師紹介</h1>
      <p className="mt-3 text-sm text-muted">
        会員限定動画は、この3名の講師が持ち回りで配信しています。
      </p>

      <div className="mt-12 space-y-16">
        {INSTRUCTORS.map((instructor, index) => (
          <section
            key={instructor.slug}
            id={instructor.slug}
            className="scroll-mt-20 border-t border-line pt-10 first:border-t-0 first:pt-0"
          >
            <span className="eyebrow">
              {String(index + 1).padStart(2, "0")} — {instructor.role}
            </span>
            <h2 className="mt-2 font-serif text-2xl font-semibold">{instructor.name}</h2>
            <p className="mt-0.5 text-sm tracking-widest text-muted">
              {instructor.nameReading}
            </p>

            <p className="mt-4 text-sm font-medium">{instructor.title}</p>
            <p className="mt-1 text-sm text-muted">
              {instructor.qualifications.join("・")}
              {instructor.specialty && (
                <span className="text-muted"> ／ 専門：{instructor.specialty}</span>
              )}
            </p>

            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">
              {instructor.bio}
            </p>

            <div className="mt-5">
              <h3 className="eyebrow">CAREER</h3>
              <ul className="mt-2 space-y-1.5 text-sm text-muted">
                {instructor.career.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span
                      className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                      aria-hidden="true"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
