export type VendorDossier = {
  name: string;
  facts: { sourceRef: string; category: string; statement: string }[];
};

const dossiers: VendorDossier[] = [
  {
    name: "Aegis Cloud",
    facts: [
      { sourceRef: "aegis-security", category: "Security", statement: "SOC 2 Type II. SAML SSO is included in the standard plan." },
      { sourceRef: "aegis-integration", category: "Integration", statement: "REST API, webhooks, and SCIM provisioning are included." },
      { sourceRef: "aegis-cost", category: "Cost", statement: "Annual software price for the demo configuration is $22,000." },
      { sourceRef: "aegis-implementation", category: "Implementation", statement: "Standard implementation estimate is four weeks." },
    ],
  },
  {
    name: "BeaconStack",
    facts: [
      { sourceRef: "beacon-security", category: "Security", statement: "SOC 2 Type II. SAML SSO requires the Enterprise add-on." },
      { sourceRef: "beacon-integration", category: "Integration", statement: "REST API and webhooks are supported. SCIM is not included." },
      { sourceRef: "beacon-cost", category: "Cost", statement: "Base annual price is $18,000. Enterprise SSO add-on is $4,000." },
      { sourceRef: "beacon-implementation", category: "Implementation", statement: "Standard implementation estimate is three weeks." },
    ],
  },
  {
    name: "Northwind AI",
    facts: [
      { sourceRef: "northwind-security", category: "Security", statement: "SOC 2 Type II. SAML SSO and SCIM are included." },
      { sourceRef: "northwind-integration", category: "Integration", statement: "REST API and webhooks are included. One legacy connector requires a custom adapter." },
      { sourceRef: "northwind-cost", category: "Cost", statement: "Annual software price for the demo configuration is $16,000." },
      { sourceRef: "northwind-implementation", category: "Implementation", statement: "Standard implementation estimate is five weeks." },
    ],
  },
  {
    name: "Orchid Systems",
    facts: [
      { sourceRef: "orchid-security", category: "Security", statement: "ISO 27001 certification is documented. SOC 2 Type II is not listed in the demo dossier." },
      { sourceRef: "orchid-integration", category: "Integration", statement: "REST API and webhooks are included. SCIM provisioning is supported." },
      { sourceRef: "orchid-cost", category: "Cost", statement: "Annual software price for the demo configuration is $14,000." },
      { sourceRef: "orchid-implementation", category: "Implementation", statement: "Standard implementation estimate is three weeks." },
    ],
  },
];

export function getVendorDossier(name: string):
  | { ok: true; dossier: VendorDossier }
  | { ok: false; name: string; error: { code: "VENDOR_NOT_FOUND"; message: string } } {
  const dossier = dossiers.find((item) => item.name.toLowerCase() === name.trim().toLowerCase());
  return dossier
    ? { ok: true, dossier: structuredClone(dossier) }
    : { ok: false, name, error: { code: "VENDOR_NOT_FOUND", message: "No first-party demo dossier exists for this vendor." } };
}
