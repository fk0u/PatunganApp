import { generateText } from "ai"
import { google } from "@ai-sdk/google"

export async function POST(req: Request) {
  try {
    const { receiptData, items = [], users = [] } = await req.json()

    /* ---------- helpers ---------- */
    const MAX_LINES = 15
    const rupiah = (n: unknown) => {
      const num = Number(n ?? 0)
      return `Rp ${num.toLocaleString("id-ID")}`
    }
    const sliceLines = (arr: any[], fmt: (v: any) => string) => {
      const lines = arr.slice(0, MAX_LINES).map(fmt)
      if (arr.length > MAX_LINES) lines.push(`- …${arr.length - MAX_LINES} entri lain`)
      return lines.join("\n")
    }

    /* ---------- build safe prompt ---------- */
    // Pisahkan item berdasarkan jenis (scan vs manual)
    const manualItems = items.filter((it: any) => it.id.startsWith('manual-item'))
    const scannedItems = items.filter((it: any) => !it.id.startsWith('manual-item'))
    
    // Format untuk item hasil scan
    const scannedItemDetails = scannedItems
      .map((it: any) => {
        let detail = `- ${it.name} (${it.quantity}x) @ ${rupiah(it.unit_price)} = ${rupiah(it.total_price)}`
        if (it.sharing_potential && it.sharing_potential > 0.5 && it.claimedBy && it.claimedBy.length > 0) {
          const numClaimers = it.claimedBy.length
          // Calculate per unit cost for shared items, then multiply by quantity
          const perPersonUnitCost = it.unit_price
          detail += ` (dibagi oleh ${it.claimedBy.join(" dan ")}, masing-masing membayar ${rupiah(perPersonUnitCost)} per unit)`
        }
        return detail
      })
      .slice(0, MAX_LINES)
      .join("\n")
      
    // Format untuk item manual
    const manualItemDetails = manualItems
      .map((it: any) => {
        let detail = `- ${it.name} (${it.quantity}x) @ ${rupiah(it.unit_price)} = ${rupiah(it.total_price)} [MANUAL]`
        if (it.sharing_potential && it.sharing_potential > 0.5 && it.claimedBy && it.claimedBy.length > 0) {
          const numClaimers = it.claimedBy.length
          const perPersonUnitCost = it.unit_price
          detail += ` (dibagi oleh ${it.claimedBy.join(" dan ")}, masing-masing membayar ${rupiah(perPersonUnitCost)} per unit)`
        }
        return detail
      })
      .slice(0, MAX_LINES)
      .join("\n")
    
    // Gabungkan kedua jenis item
    const itemDetails = scannedItemDetails + (manualItemDetails ? "\n\n--- Item Manual Tambahan ---\n" + manualItemDetails : "")

    const userLines = sliceLines(users, (u) => `- ${u.name}: ${rupiah(u.total)}`)

    const prompt = `
Anda adalah asisten finansial ramah. Berikan ringkasan dan analisis singkat (maksimal 250 kata) untuk pembagian tagihan berikut. Fokus pada insight dan penjelasan yang mudah dimengerti.

--- Detail Struk ---
Restoran       : ${receiptData?.restaurant_info?.name ?? "Tidak Diketahui"}
Tanggal        : ${receiptData?.restaurant_info?.date ?? "-"}
Nomor Transaksi: ${receiptData?.restaurant_info?.transaction_id ?? "Tidak Tersedia"}
Subtotal       : ${rupiah(receiptData?.summary?.subtotal)}
PPN            : ${rupiah(receiptData?.summary?.ppn)}
Total Akhir    : ${rupiah(receiptData?.summary?.total)}

--- Item yang Dipesan ---
Berikut adalah daftar item yang dipesan, termasuk Nama Item, Kuantitas, Harga Satuan, dan Total Harga per Item (Kuantitas x Harga Satuan).
Untuk item yang dibagi, saya akan menjelaskan berapa yang harus dibayar oleh masing-masing orang.
Contoh: Jika 'Kopi KK Latte' dibeli 2 buah dengan harga satuan Rp 7.700 (total Rp 15.400), dan diklaim oleh 'Saya' dan 'Adit', maka masing-masing akan membayar Rp 7.700 (karena mereka masing-masing mengambil 1 unit dari 2 unit yang dibeli).
${itemDetails}

--- Pembagian Individual ---
Berikut adalah total tagihan untuk setiap peserta setelah pembagian:
${userLines}

Berdasarkan data di atas, berikan analisis yang menarik dan mudah dimengerti.
1. Konfirmasi detail transaksi utama (Subtotal, PPN, Total Akhir).
2. Jelaskan item-item yang dibeli, dan **secara khusus sorot bagaimana item yang dibagi dihitung per orang berdasarkan harga satuan per unit yang mereka klaim**, berikan contoh jika ada.
3. Jika ada item yang ditambahkan secara manual (ditandai [MANUAL]), jelaskan bahwa ini adalah item tambahan yang diinput pengguna, bukan dari hasil scan struk asli.
4. Ringkas total tagihan individual.
5. Sorot siapa yang paling banyak membayar, item terpopuler, dan berikan tips keuangan kecil yang relevan.
6. Akhiri dengan kalimat penyemangat.
`.trim()

    /* ---------- call model ---------- */
    let analysis = "Maaf, analisis AI belum tersedia. Coba lagi nanti!"

    const GEMINI_KEY =
      process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.NEXT_PUBLIC_GEMINI_API_KEY
    if (!GEMINI_KEY) {
      console.error("Gemini API key missing")
    }

    try {
      const { text } = await generateText({
        model: google("gemini-2.5-flash", { apiKey: GEMINI_KEY as string }),
        prompt,
      })
      analysis = text
    } catch (modelErr) {
      console.error("Gemini call failed:", modelErr)
    }

    return Response.json({ analysis }) // ← selalu 200
  } catch (err) {
    console.error("analyze-local-receipt route error:", err)
    return Response.json({
      analysis:
        "Maaf, terjadi kesalahan internal sehingga analisis AI tidak dapat dibuat. Namun sesi Anda sudah disimpan ✅",
    }) // tetap 200 agar klien tidak melempar error
  }
}
