const pesoNumberFormatter = new Intl.NumberFormat("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
})

export function formatPeso(value) {
    const amount = Number(value)
    return `₱${pesoNumberFormatter.format(Number.isFinite(amount) ? amount : 0)}`
}
