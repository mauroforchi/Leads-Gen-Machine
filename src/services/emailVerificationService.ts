
export interface VerificationResult {
  isValid: boolean;
  score: number;
  details: string[];
  format: string;
}

export async function verifyEmail(email: string, companyName: string): Promise<VerificationResult> {
  const details: string[] = [];
  let score = 0;

  // 1. Syntax Check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isSyntaxValid = emailRegex.test(email);
  
  if (!isSyntaxValid) {
    return { isValid: false, score: 0, details: ["Sintaxis inválida"], format: "unknown" };
  }
  score += 30;
  details.push("Sintaxis correcta");

  // 2. Domain Consistency
  const domain = email.split('@')[1].toLowerCase();
  const companySlug = companyName.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  if (domain.includes(companySlug) || companySlug.includes(domain.split('.')[0])) {
    score += 40;
    details.push("Dominio coincide con la empresa");
  } else {
    details.push("Dominio genérico o externo");
    score += 10;
  }

  // 3. Pattern Check (Common corporate patterns)
  const [localPart] = email.split('@');
  if (localPart.includes('.') || localPart.includes('_')) {
    score += 20;
    details.push("Patrón nominal detectado (Nombre.Apellido)");
  }

  // 4. Disposable Check (Basic list)
  const disposableDomains = ['tempmail.com', 'mailinator.com', '10minutemail.com', 'guerrillamail.com'];
  if (disposableDomains.includes(domain)) {
    score -= 50;
    details.push("Dominio desechable detectado");
  } else {
    score += 10;
    details.push("Dominio corporativo/estable");
  }

  // Normalize score
  score = Math.max(0, Math.min(100, score));

  return {
    isValid: score > 50,
    score,
    details,
    format: localPart.includes('.') ? "nombre.apellido" : "inicial.apellido"
  };
}
