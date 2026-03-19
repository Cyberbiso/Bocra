"use client";

import InnerPageLayout from "@/components/InnerPageLayout";
import { motion } from "framer-motion";
import Image from "next/image";

const ABOUT_LINKS = [
  { label: "Profile", href: "/about/profile" },
  { label: "Word from the CEO", href: "/about/chief-executive" },
  { label: "History", href: "/about/history" },
  { label: "Board of Directors", href: "/about/board", active: true },
  { label: "Executive Management", href: "/about/executive" },
  { label: "Careers", href: "/about/careers" },
];

const BOARD = [
  {
    name: "Dr. Bokamoso Basutli",
    role: "Chairperson",
    photo: "/people/basutli.jpg",
    initials: "BB",
    accentColor: "bg-[#06193e]",
    bio: "An engineering professional and IEEE Senior Member leading satellite communications and artificial intelligence initiatives at the Botswana International University of Science and Technology (BIUST). He holds a PhD from Loughborough University, UK.",
    expertise: ["Satellite Communications", "Artificial Intelligence", "Engineering"],
  },
  {
    name: "Mr. Moabi Pusumane",
    role: "Vice Chairperson",
    photo: "/people/pusumane.jpg",
    initials: "MP",
    accentColor: "bg-[#1B75BB]",
    bio: "A commercial executive with over 15 years of experience in telecommunications and project management. Currently serving as Commercial Director at Coca-Cola Beverages Botswana.",
    expertise: ["Telecommunications", "Project Management", "Commercial Strategy"],
  },
  {
    name: "Ms. Montle Phuthego",
    role: "Board Member",
    photo: "/people/phuthego.jpg",
    initials: "MP",
    accentColor: "bg-[#75AADB]",
    bio: "An economist and business development specialist with more than 20 years in executive roles across development agencies and entrepreneurship programmes.",
    expertise: ["Economics", "Business Development", "Entrepreneurship"],
  },
  {
    name: "Ms. Alta Dimpho Seleka",
    role: "Board Member",
    photo: "/people/seleka.jpg",
    initials: "AS",
    accentColor: "bg-[#872030]",
    bio: "A finance professional with dual chartered accountant credentials. Currently Acting Commissioner for Finance at BURS, overseeing multibillion-pula revenue operations.",
    expertise: ["Finance", "Chartered Accountancy", "Revenue Management"],
  },
  {
    name: "Ms. Lebogang George",
    role: "Board Member",
    photo: "/people/george.jpg",
    initials: "LG",
    accentColor: "bg-[#1C6B3C]",
    bio: "An attorney specialising in ICT law, data protection, and corporate governance with experience across multiple jurisdictions in Africa.",
    expertise: ["ICT Law", "Data Protection", "Corporate Governance"],
  },
  {
    name: "Mr. Ronald Kgafela",
    role: "Board Member",
    photo: "/people/kgafela.jpg",
    initials: "RK",
    accentColor: "bg-violet-700",
    bio: "A human capital leader with over 20 years of experience spanning HR, organisational development, and transformation across multiple industries.",
    expertise: ["Human Resources", "Organisational Development", "Transformation"],
  },
  {
    name: "Dr. Kennedy Ramojela",
    role: "Board Member",
    photo: "/people/ramojela.jpg",
    initials: "KR",
    accentColor: "bg-[#D4921A]",
    bio: "A media and communications practitioner with advanced degrees from international institutions. Currently a lecturer at the University of Botswana.",
    expertise: ["Media", "Communications", "Academia"],
  },
];

export default function BoardPage() {
  return (
    <InnerPageLayout
      section="About"
      title="Board of Directors"
      breadcrumbs={[{ label: "About", href: "/about" }, { label: "Board of Directors", href: "/about/board" }]}
      sidebarLinks={ABOUT_LINKS}
    >
      <div className="space-y-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <p className="text-gray-600 leading-relaxed">
            BOCRA is governed by a Board of Directors comprising seven non-executive members and the Chief Executive
            who serves ex-officio. The Minister of Transport and Communications appointed the current Board with
            effect from <strong className="text-[#06193e]">1 August 2025</strong>.
          </p>
          <p className="text-gray-600 leading-relaxed mt-3">
            The Board provides strategic oversight and ensures BOCRA fulfils its mandate as an independent
            regulatory authority in accordance with the Communications Regulatory Authority Act, 2012.
          </p>
        </div>

        {/* Chairperson — full-width featured card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-[#06193e] rounded-2xl overflow-hidden shadow-lg"
        >
          <div className="flex flex-col sm:flex-row">
            <div className="relative sm:w-56 h-64 sm:h-auto shrink-0">
              <Image
                src={BOARD[0].photo}
                alt={BOARD[0].name}
                fill
                className="object-cover"
                style={{ objectPosition: "center 8%" }}
                sizes="(max-width: 640px) 100vw, 224px"
              />
              <div className="absolute inset-0 bg-linear-to-t from-[#06193e] via-transparent to-transparent sm:bg-linear-to-r sm:from-transparent sm:to-[#06193e]" />
            </div>
            <div className="p-7 flex flex-col justify-center">
              <span className="text-[#D4921A] text-[10px] font-black uppercase tracking-[0.2em] mb-1">Chairperson</span>
              <h3 className="text-2xl font-black text-white mb-1">{BOARD[0].name}</h3>
              <p className="text-[#75AADB] text-sm font-semibold mb-4">{BOARD[0].role}</p>
              <p className="text-gray-300 text-sm leading-relaxed mb-4">{BOARD[0].bio}</p>
              <div className="flex flex-wrap gap-2">
                {BOARD[0].expertise.map((e) => (
                  <span key={e} className="text-xs font-semibold bg-white/10 text-[#75AADB] px-2.5 py-1 rounded-full">
                    {e}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Rest of board — 2-col grid */}
        <div className="grid md:grid-cols-2 gap-5">
          {BOARD.slice(1).map((member, i) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow group"
            >
              {/* Photo strip */}
              <div className="relative h-64 w-full overflow-hidden">
                <Image
                  src={member.photo}
                  alt={member.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  style={{ objectPosition: "center 8%" }}
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-transparent" />
                {/* Role badge */}
                <div className="absolute bottom-3 left-3">
                  <span className={`text-[10px] font-black uppercase tracking-widest text-white px-2.5 py-1 rounded-full ${member.accentColor}`}>
                    {member.role}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="font-black text-[#06193e] text-base leading-tight mb-1">{member.name}</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">{member.bio}</p>
                <div className="flex flex-wrap gap-1.5">
                  {member.expertise.map((e) => (
                    <span key={e} className="text-xs font-semibold bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                      {e}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </InnerPageLayout>
  );
}
