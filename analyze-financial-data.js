#!/usr/bin/env node

/**
 * Humanitix Financial Data Analysis
 * Analyzes order financial structures for accurate partner invoicing
 */

import fs from 'fs';

// Load the orders data
const ordersPath = './docs/humanitix-all-orders.json';
const ordersData = JSON.parse(fs.readFileSync(ordersPath, 'utf8'));

console.log('🔍 Starting Financial Analysis...\n');

// Extract all orders from the data
const allOrders = ordersData.orders;

console.log(`📊 Analyzing ${allOrders.length} orders across ${ordersData.totalEvents} events`);

// Analyze financial structures
function analyzeFinancialStructures() {
    const analysis = {
        totalOrders: allOrders.length,
        orderStatuses: {},
        financialStatuses: {},
        paymentMethods: {},
        currencies: {},
        feeStructures: {
            humanitixFee: { min: Infinity, max: -Infinity, avg: 0, total: 0 },
            bookingFee: { min: Infinity, max: -Infinity, avg: 0, total: 0 },
            passedOnFee: { min: Infinity, max: -Infinity, avg: 0, total: 0 },
            absorbedFee: { min: Infinity, max: -Infinity, avg: 0, total: 0 },
            amexFee: { min: Infinity, max: -Infinity, avg: 0, total: 0 },
            zipFee: { min: Infinity, max: -Infinity, avg: 0, total: 0 }
        },
        revenueMetrics: {
            totalSubtotal: 0,
            totalGrossSales: 0,
            totalNetSales: 0,
            totalFeesCollected: 0,
            totalDiscounts: 0,
            totalRefunds: 0,
            totalDonations: 0,
            totalRebates: 0
        },
        discountPatterns: {},
        refundPatterns: {},
        taxAnalysis: {
            totalTaxes: 0,
            bookingTaxes: 0,
            passedOnTaxes: 0
        },
        partnerRevenue: {
            totalPartnerShare: 0,
            averagePartnerShare: 0,
            partnerRevenueByEvent: {}
        }
    };

    // Process each order
    allOrders.forEach(order => {
        const totals = order.totals || order.purchaseTotals || {};

        // Order status tracking
        analysis.orderStatuses[order.status] = (analysis.orderStatuses[order.status] || 0) + 1;
        analysis.financialStatuses[order.financialStatus] = (analysis.financialStatuses[order.financialStatus] || 0) + 1;

        // Payment method tracking
        const paymentMethod = order.paymentGateway || 'unknown';
        analysis.paymentMethods[paymentMethod] = (analysis.paymentMethods[paymentMethod] || 0) + 1;

        // Currency tracking
        analysis.currencies[order.currency] = (analysis.currencies[order.currency] || 0) + 1;

        // Fee structure analysis
        ['humanitixFee', 'bookingFee', 'passedOnFee', 'absorbedFee', 'amexFee', 'zipFee'].forEach(feeType => {
            const feeAmount = totals[feeType] || 0;
            const feeData = analysis.feeStructures[feeType];

            if (feeAmount > 0) {
                feeData.min = Math.min(feeData.min, feeAmount);
                feeData.max = Math.max(feeData.max, feeAmount);
                feeData.total += feeAmount;
            }
        });

        // Revenue metrics
        analysis.revenueMetrics.totalSubtotal += totals.subtotal || 0;
        analysis.revenueMetrics.totalGrossSales += totals.grossSales || 0;
        analysis.revenueMetrics.totalNetSales += totals.netSales || 0;
        analysis.revenueMetrics.totalFeesCollected += (totals.humanitixFee || 0) + (totals.bookingFee || 0);
        analysis.revenueMetrics.totalDiscounts += totals.discounts || 0;
        analysis.revenueMetrics.totalRefunds += totals.refunds || 0;
        analysis.revenueMetrics.totalDonations += (totals.donation || 0) + (totals.clientDonation || 0);
        analysis.revenueMetrics.totalRebates += totals.rebates || 0;

        // Discount analysis
        if (totals.discounts > 0) {
            analysis.discountPatterns[totals.discounts] = (analysis.discountPatterns[totals.discounts] || 0) + 1;
        }

        // Refund analysis
        if (totals.refunds > 0) {
            analysis.refundPatterns[totals.refunds] = (analysis.refundPatterns[totals.refunds] || 0) + 1;
        }

        // Tax analysis
        analysis.taxAnalysis.totalTaxes += totals.totalTaxes || 0;
        analysis.taxAnalysis.bookingTaxes += totals.bookingTaxes || 0;
        analysis.taxAnalysis.passedOnTaxes += totals.passedOnTaxes || 0;

        // Partner revenue calculation
        const partnerShare = calculatePartnerRevenue(totals);
        analysis.partnerRevenue.totalPartnerShare += partnerShare;

        // Per-event partner revenue
        if (!analysis.partnerRevenue.partnerRevenueByEvent[order.eventId]) {
            analysis.partnerRevenue.partnerRevenueByEvent[order.eventId] = {
                eventName: order.eventName,
                totalRevenue: 0,
                totalOrders: 0,
                averageOrderValue: 0
            };
        }

        const eventData = analysis.partnerRevenue.partnerRevenueByEvent[order.eventId];
        eventData.totalRevenue += partnerShare;
        eventData.totalOrders += 1;
        eventData.averageOrderValue = eventData.totalRevenue / eventData.totalOrders;
    });

    // Calculate averages
    Object.keys(analysis.feeStructures).forEach(feeType => {
        const feeData = analysis.feeStructures[feeType];
        if (feeData.total > 0) {
            feeData.avg = feeData.total / allOrders.length;
            if (feeData.min === Infinity) feeData.min = 0;
            if (feeData.max === -Infinity) feeData.max = 0;
        } else {
            feeData.min = 0;
            feeData.max = 0;
        }
    });

    analysis.partnerRevenue.averagePartnerShare = analysis.partnerRevenue.totalPartnerShare / allOrders.length;

    return analysis;
}

// Calculate partner revenue (net sales minus fees)
function calculatePartnerRevenue(totals) {
    const subtotal = totals.subtotal || 0;
    const discounts = totals.discounts || 0;
    const refunds = totals.refunds || 0;
    const passedOnFee = totals.passedOnFee || 0;
    const absorbedFee = totals.absorbedFee || 0;

    // Partner gets: subtotal - discounts - refunds - passed on fees
    // Absorbed fees are covered by Humanitix, not the partner
    return subtotal - discounts - refunds - passedOnFee;
}

// Analyze transaction patterns
function analyzeTransactionPatterns() {
    const patterns = {
        averageOrderValue: 0,
        medianOrderValue: 0,
        orderValueDistribution: {},
        completionRates: {
            total: allOrders.length,
            complete: 0,
            incomplete: 0,
            cancelled: 0,
            refunded: 0
        },
        paymentSuccess: {
            paid: 0,
            failed: 0,
            pending: 0,
            refunded: 0
        }
    };

    const orderValues = [];

    allOrders.forEach(order => {
        const total = order.totals?.total || order.purchaseTotals?.total || 0;
        orderValues.push(total);

        // Order value distribution
        const range = getOrderValueRange(total);
        patterns.orderValueDistribution[range] = (patterns.orderValueDistribution[range] || 0) + 1;

        // Completion rates
        patterns.completionRates[order.status] = (patterns.completionRates[order.status] || 0) + 1;

        // Payment success
        patterns.paymentSuccess[order.financialStatus] = (patterns.paymentSuccess[order.financialStatus] || 0) + 1;
    });

    // Calculate averages
    patterns.averageOrderValue = orderValues.reduce((sum, val) => sum + val, 0) / orderValues.length;

    // Calculate median
    const sortedValues = orderValues.sort((a, b) => a - b);
    const mid = Math.floor(sortedValues.length / 2);
    patterns.medianOrderValue = sortedValues.length % 2 === 0 
        ? (sortedValues[mid - 1] + sortedValues[mid]) / 2 
        : sortedValues[mid];

    return patterns;
}

// Get order value range category
function getOrderValueRange(value) {
    if (value === 0) return 'Free';
    if (value <= 10) return '$1-$10';
    if (value <= 25) return '$11-$25';
    if (value <= 50) return '$26-$50';
    if (value <= 100) return '$51-$100';
    return '$100+';
}

// Analyze fee absorption patterns
function analyzeFeeAbsorption() {
    const absorption = {
        totalAbsorbed: 0,
        totalPassedOn: 0,
        absorptionRate: 0,
        absorptionByEvent: {},
        feeAbsorptionStrategies: {
            fullAbsorption: 0,
            partialAbsorption: 0,
            noAbsorption: 0
        }
    };

    allOrders.forEach(order => {
        const totals = order.totals || order.purchaseTotals || {};
        const absorbed = totals.absorbedFee || 0;
        const passedOn = totals.passedOnFee || 0;

        absorption.totalAbsorbed += absorbed;
        absorption.totalPassedOn += passedOn;

        // Per-event absorption
        if (!absorption.absorptionByEvent[order.eventId]) {
            absorption.absorptionByEvent[order.eventId] = {
                eventName: order.eventName,
                totalAbsorbed: 0,
                totalPassedOn: 0,
                orderCount: 0
            };
        }

        const eventData = absorption.absorptionByEvent[order.eventId];
        eventData.totalAbsorbed += absorbed;
        eventData.totalPassedOn += passedOn;
        eventData.orderCount += 1;

        // Absorption strategies
        if (absorbed > 0 && passedOn === 0) {
            absorption.feeAbsorptionStrategies.fullAbsorption += 1;
        } else if (absorbed > 0 && passedOn > 0) {
            absorption.feeAbsorptionStrategies.partialAbsorption += 1;
        } else {
            absorption.feeAbsorptionStrategies.noAbsorption += 1;
        }
    });

    absorption.absorptionRate = absorption.totalAbsorbed / (absorption.totalAbsorbed + absorption.totalPassedOn);

    return absorption;
}

// Generate sample invoice data
function generateSampleInvoiceData() {
    // Find an event with orders
    const eventWithOrders = allOrders.find(o => o.eventId);
    if (!eventWithOrders) return null;

    const sampleEventId = eventWithOrders.eventId;
    const eventOrders = allOrders.filter(o => o.eventId === sampleEventId);

    const invoiceData = {
        eventId: sampleEventId,
        eventName: eventWithOrders.eventName,
        eventDate: eventWithOrders.eventDate,
        venue: eventWithOrders.venue,
        orderCount: eventOrders.length,
        summary: {
            totalGrossSales: 0,
            totalNetSales: 0,
            totalFees: 0,
            totalDiscounts: 0,
            totalRefunds: 0,
            partnerShare: 0,
            humanitixShare: 0
        },
        orderBreakdown: eventOrders.map(order => {
            const totals = order.totals || order.purchaseTotals || {};
            return {
                orderId: order._id,
                orderName: order.orderName,
                customer: {
                    name: `${order.firstName} ${order.lastName}`,
                    email: order.email
                },
                subtotal: totals.subtotal || 0,
                fees: {
                    humanitix: totals.humanitixFee || 0,
                    booking: totals.bookingFee || 0,
                    passedOn: totals.passedOnFee || 0,
                    absorbed: totals.absorbedFee || 0
                },
                discounts: totals.discounts || 0,
                refunds: totals.refunds || 0,
                total: totals.total || 0,
                partnerShare: calculatePartnerRevenue(totals),
                status: order.status,
                financialStatus: order.financialStatus,
                completedAt: order.completedAt
            };
        })
    };

    // Calculate summary
    invoiceData.orderBreakdown.forEach(order => {
        invoiceData.summary.totalGrossSales += order.subtotal;
        invoiceData.summary.totalNetSales += order.total;
        invoiceData.summary.totalFees += order.fees.humanitix + order.fees.booking;
        invoiceData.summary.totalDiscounts += order.discounts;
        invoiceData.summary.totalRefunds += order.refunds;
        invoiceData.summary.partnerShare += order.partnerShare;
    });

    invoiceData.summary.humanitixShare = invoiceData.summary.totalFees;

    return invoiceData;
}

// Run analysis
const financialAnalysis = analyzeFinancialStructures();
const transactionPatterns = analyzeTransactionPatterns();
const feeAbsorption = analyzeFeeAbsorption();
const sampleInvoice = generateSampleInvoiceData();

// Create comprehensive report
const report = {
    generatedAt: new Date().toISOString(),
    summary: {
        totalOrders: allOrders.length,
        totalEvents: ordersData.totalEvents,
        totalRevenue: financialAnalysis.revenueMetrics.totalGrossSales,
        totalPartnerShare: financialAnalysis.partnerRevenue.totalPartnerShare,
        averageOrderValue: transactionPatterns.averageOrderValue,
        medianOrderValue: transactionPatterns.medianOrderValue
    },
    financialStructures: financialAnalysis,
    transactionPatterns,
    feeAbsorption,
    sampleInvoiceData: sampleInvoice
};

// Save comprehensive analysis
const outputPath = './docs/humanitix-financial-analysis.json';
fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));

console.log('\n📊 Financial Analysis Complete!');
console.log(`💰 Total Revenue: $${report.summary.totalRevenue.toFixed(2)}`);
console.log(`🤝 Partner Share: $${report.summary.totalPartnerShare.toFixed(2)}`);
console.log(`📈 Average Order: $${report.summary.averageOrderValue.toFixed(2)}`);
console.log(`📄 Report saved to: ${outputPath}`);