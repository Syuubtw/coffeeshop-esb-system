/**
 * Utility untuk memformat kode meja teknis (TB-01, TB-VIP, TB-BAR) 
 * menjadi nama ramah bahasa Indonesia (Meja 01, Ruang VIP, Meja Bar 01)
 * sesuai standar antarmuka kasir dan pelanggan kafe.
 */

export function formatTableDisplayName(raw: string | undefined | null): string {
  if (!raw) return 'Meja -';
  const trimmed = raw.trim();

  // Jika sudah berformat "Meja 01" atau "Ruang VIP", kembalikan langsung
  if (/^meja\s+\d+/i.test(trimmed)) {
    return trimmed.replace(/^meja\s+/i, 'Meja ');
  }
  if (/^ruang\s+vip/i.test(trimmed)) {
    return trimmed;
  }

  const upper = trimmed.toUpperCase();

  // TB-01 s/d TB-99 -> Meja 01 s/d Meja 99
  const tbMatch = upper.match(/^TB-(\d+)$/);
  if (tbMatch) {
    return `Meja ${tbMatch[1]}`;
  }

  // TB-VIP atau TB-VIP-01 -> Ruang VIP atau Ruang VIP 01
  if (upper.includes('VIP')) {
    const vipMatch = upper.match(/VIP-(\d+)/);
    return vipMatch ? `Ruang VIP ${vipMatch[1]}` : 'Ruang VIP';
  }

  // TB-BAR-01 -> Meja Bar 01
  if (upper.includes('BAR')) {
    const barMatch = upper.match(/BAR-(\d+)/);
    return barMatch ? `Meja Bar ${barMatch[1]}` : 'Meja Bar';
  }

  // TB-OUT-01 -> Area Outdoor 01
  if (upper.includes('OUT')) {
    const outMatch = upper.match(/OUT-(\d+)/);
    return outMatch ? `Outdoor ${outMatch[1]}` : 'Area Outdoor';
  }

  // Fallback: jika berawalan TB-, hapus TB-
  if (upper.startsWith('TB-')) {
    return `Meja ${upper.replace('TB-', '')}`;
  }

  return raw;
}
