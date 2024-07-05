const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');

const validateMonthParameter = (req, res, next) => {
    const { month } = req.query;
    if (!month || isNaN(parseInt(month))) {
        return res.status(400).json({ error: 'Invalid month parameter' });
    }
    next();
};

router.get('/sales', validateMonthParameter, async (req, res) => {
    try {
        const { month } = req.query;
        const monthInt = parseInt(month);

        const totalSaleAmount = await Transaction.aggregate([
            {
                $match: {
                    $expr: {
                        $eq: [{ $month: '$dateOfSale' }, monthInt]
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: '$price' }
                }
            }
        ]);
        const totalSoldItems = await Transaction.countDocuments({
            $expr: {
                $and: [
                    { $eq: [{ $month: '$dateOfSale' }, monthInt] },
                    { $eq: ['$sold', true] }
                ]
            }
        });
        const totalNotSoldItems = await Transaction.countDocuments({
            $expr: {
                $and: [
                    { $eq: [{ $month: '$dateOfSale' }, monthInt] },
                    { $eq: ['$sold', false] }
                ]
            }
        });

        res.status(200).json({
            totalSaleAmount: totalSaleAmount.length > 0 ? totalSaleAmount[0].totalAmount : 0,
            totalSoldItems,
            totalNotSoldItems
        });
    } catch (error) {
        console.error('Error fetching statistics:', error);
        res.status(500).json({ error: 'Failed to fetch statistics', message: error.message });
    }
});
router.get('/bar-chart', validateMonthParameter, async (req, res) => {
    try {
        const { month } = req.query;
        const monthInt = parseInt(month);

        const priceRanges = [
            { min: 0, max: 100 },
            { min: 101, max: 200 },
            { min: 201, max: 300 },
            { min: 301, max: 400 },
            { min: 401, max: 500 },
            { min: 501, max: 600 },
            { min: 601, max: 700 },
            { min: 701, max: 800 },
            { min: 801, max: 900 },
            { min: 901, max: Infinity }
        ];

        const aggregationPipeline = [
            {
                $match: {
                    $expr: {
                        $eq: [{ $month: '$dateOfSale' }, monthInt]
                    }
                }
            },
            {
                $project: {
                    price: 1,
                    month: { $month: '$dateOfSale' }
                }
            },
            {
                $group: {
                    _id: null,
                    priceRanges: {
                        $push: {
                            range: {
                                $switch: {
                                    branches: priceRanges.map(range => ({
                                        case: {
                                            $and: [
                                                { $gte: ['$price', range.min] },
                                                { $lte: ['$price', range.max] }
                                            ]
                                        },
                                        then: `${range.min}-${range.max}`
                                    })),
                                    default: 'Other'
                                }
                            },
                            count: { $sum: 1 }
                        }
                    }
                }
            },
            {
                $unwind: '$priceRanges'
            },
            {
                $group: {
                    _id: '$priceRanges.range',
                    count: { $sum: '$priceRanges.count' }
                }
            },
            {
                $project: {
                    _id: 0,
                    range: '$_id',
                    count: 1
                }
            }
        ];

        const result = await Transaction.aggregate(aggregationPipeline);

        res.status(200).json(result);
    } catch (error) {
        console.error('Error fetching bar chart data:', error);
        res.status(500).json({ error: 'Failed to fetch bar chart data', message: error.message });
    }
});

router.get('/pie-chart', validateMonthParameter, async (req, res) => {
    try {
        const { month } = req.query;
        const monthInt = parseInt(month);

        const aggregationPipeline = [
            {
                $match: {
                    $expr: {
                        $eq: [{ $month: '$dateOfSale' }, monthInt]
                    }
                }
            },
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    category: '$_id',
                    count: 1,
                    _id: 0
                }
            }
        ];

        const result = await Transaction.aggregate(aggregationPipeline);

        res.status(200).json(result);
    } catch (error) {
        console.error('Error fetching pie chart data:', error);
        res.status(500).json({ error: 'Failed to fetch pie chart data', message: error.message });
    }
});

module.exports = router;
