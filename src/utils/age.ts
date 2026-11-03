// src/utils/age.ts — compute age from DOB. Server is the source of truth;
// any client-supplied age is ignored.
export function computeAge(dob: string | Date): number {
  const birth = typeof dob === "string" ? new Date(dob) : dob;
  if (Number.isNaN(birth.getTime())) {
    throw new Error(`Invalid date_of_birth: ${dob}`);
  }
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  if (age < 0 || age > 130) {
    throw new Error(`Computed age ${age} is out of range (0–130).`);
  }
  return age;
}
