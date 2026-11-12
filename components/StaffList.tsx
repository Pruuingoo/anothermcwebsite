"use client";
import { useEffect, useState } from "react";
import { siteConfig } from "@/lib/site-config";

type Staff = { id: string; fallback: string; role: string; url: string | null; displayName?: string | null; avatarUrl?: string | null };
const exampleStaff: Staff[] = [
  { id: "staff-1", fallback: siteConfig.ownerName, role: "Owner", url: null },
  { id: "staff-2", fallback: siteConfig.adminName, role: "Admin", url: null },
  { id: "staff-3", fallback: siteConfig.developerName, role: "Developer", url: null },
  { id: "staff-4", fallback: siteConfig.moderatorName, role: "Moderator", url: null },
];
const groups: [string, string[]][] = [
  ["Leadership", ["Owner"]],
  ["Administration", ["Admin"]],
  ["Development", ["Developer"]],
  ["Moderation", ["Moderator"]],
];

export default function StaffList() {
  const [staff, setStaff] = useState<Staff[]>(exampleStaff);
  useEffect(() => {
    let active = true;
    fetch("/api/staff", { cache: "no-store" }).then((response) => response.ok ? response.json() : Promise.reject())
      .then((data) => { if (active && Array.isArray(data.staff)) setStaff(data.staff); }).catch(() => {});
    return () => { active = false; };
  }, []);
  return <div className="wc-staff-groups">{groups.map(([group, roles]) => {
    const members = staff.filter((member) => roles.includes(member.role));
    if (!members.length) return null;
    return <section className="wc-staff-group" key={group} aria-label={group}><h3>{group}</h3><div className="wc-staff-grid">{members.map((member) => {
      const name = member.displayName || member.fallback;
      return <a className="wc-staff-card" href={member.url || "/contact"} key={member.id} aria-label={`${name}, ${member.role}`}>
        <img src={member.avatarUrl || "/server-placeholder.svg"} alt="" loading="lazy" />
        <strong>{name}</strong><span>{member.role}</span>
      </a>;
    })}</div></section>;
  })}</div>;
}
