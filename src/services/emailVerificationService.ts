
export interface VerificationResult {
  isValid: boolean;
  score: number;
  details: string[];
  format: string;
}

export async function verifyEmail(email: string, companyName: string): Promise<VerificationResult> {
  const details: string[] = [];
  let score = 0;

  // 1. Syntax Check (RFC 5322 compliant-ish)
  const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  const isSyntaxValid = emailRegex.test(email);
  
  if (!isSyntaxValid) {
    return { isValid: false, score: 0, details: ["Sintaxis inválida"], format: "unknown" };
  }
  score += 20;
  details.push("Sintaxis correcta");

  const [localPart, domain] = email.toLowerCase().split('@');

  // 2. Role-based Email Check
  const roleBasedPrefixes = ['info', 'sales', 'marketing', 'support', 'admin', 'contact', 'hello', 'ventas', 'soporte', 'hr', 'recursos.humanos', 'office', 'billing', 'jobs'];
  if (roleBasedPrefixes.includes(localPart)) {
    score -= 20;
    details.push("Email genérico/de rol (baja prioridad)");
  } else {
    score += 15;
    details.push("Email personal/directo");
  }

  // 3. Domain Consistency & Typos
  const companySlug = companyName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const domainTypos = ['gmal.com', 'hotmal.com', 'outlok.com', 'yaho.com', 'protonmal.com'];
  
  if (domainTypos.includes(domain)) {
    score -= 40;
    details.push("Posible error tipográfico en el dominio");
  }

  const isCorporate = domain.includes(companySlug) || companySlug.includes(domain.split('.')[0]);
  if (isCorporate) {
    score += 35;
    details.push("Dominio coincide con la empresa");
  } else {
    const freeProviders = ['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'icloud.com', 'me.com', 'protonmail.com', 'zoho.com'];
    if (freeProviders.includes(domain)) {
      score += 10;
      details.push("Proveedor de correo gratuito");
    } else {
      score += 5;
      details.push("Dominio externo/desconocido");
    }
  }

  // 4. Pattern Check
  if (localPart.includes('.') || localPart.includes('_') || localPart.includes('-')) {
    score += 20;
    details.push("Patrón nominal detectado");
  }

  // 5. Disposable Check (Expanded)
  const disposableDomains = [
    'tempmail.com', 'mailinator.com', '10minutemail.com', 'guerrillamail.com', 
    'sharklasers.com', 'dispostable.com', 'getnada.com', 'boun.cr', 'trashmail.com'
  ];
  if (disposableDomains.includes(domain)) {
    score = 0;
    details.push("Dominio desechable detectado (Bloqueado)");
  } else {
    score += 10;
    details.push("Dominio estable");
  }

  // Normalize score
  score = Math.max(0, Math.min(100, score));

  return {
    isValid: score >= 60,
    score,
    details,
    format: localPart.includes('.') ? "nombre.apellido" : "inicial.apellido"
  };
}
