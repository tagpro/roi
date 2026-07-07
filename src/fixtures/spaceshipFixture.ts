// SYNTHETIC Spaceship-shaped fixture. Amounts, units, and prices are all
// generated from a made-up price curve (weekly $25 buys with a $50 stretch,
// price dipping mid-year and ending 2.40% below its start). This is NOT a
// real export. Expected metrics: invested 1500.00, units 651.111047,
// latest price 2.44 (2026-06-30), est. value ~1588.71, net gain ~+88.71,
// ROI ~+5.91%, XIRR ~+12.35%, unit-price change -2.40%.

export const spaceshipFixtureCsv = `
Transaction Date,Transaction Type,Status,Amount,Units,Unit Price,Unit Change Type,Effective Date,Portfolio
2026-06-29,Investment plan (weekly),Paid,25.00,10.245902,2.440000,Units issued,2026-06-30,Spaceship Universe Portfolio
2026-06-22,Investment plan (weekly),Paid,25.00,10.245578,2.440077,Units issued,2026-06-23,Spaceship Universe Portfolio
2026-06-15,Investment plan (weekly),Paid,25.00,10.254420,2.437973,Units issued,2026-06-16,Spaceship Universe Portfolio
2026-06-08,Investment plan (weekly),Paid,25.00,10.272264,2.433738,Units issued,2026-06-09,Spaceship Universe Portfolio
2026-06-01,Investment plan (weekly),Paid,25.00,10.298861,2.427453,Units issued,2026-06-02,Spaceship Universe Portfolio
2026-05-25,Investment plan (weekly),Paid,25.00,10.333862,2.419231,Units issued,2026-05-26,Spaceship Universe Portfolio
2026-05-18,Investment plan (weekly),Paid,25.00,10.376824,2.409215,Units issued,2026-05-19,Spaceship Universe Portfolio
2026-05-11,Investment plan (weekly),Paid,25.00,10.427202,2.397575,Units issued,2026-05-12,Spaceship Universe Portfolio
2026-05-04,Investment plan (weekly),Paid,25.00,10.484356,2.384505,Units issued,2026-05-05,Spaceship Universe Portfolio
2026-04-27,Investment plan (weekly),Paid,25.00,10.547544,2.370220,Units issued,2026-04-28,Spaceship Universe Portfolio
2026-04-20,Investment plan (weekly),Paid,25.00,10.615910,2.354956,Units issued,2026-04-21,Spaceship Universe Portfolio
2026-04-13,Investment plan (weekly),Paid,25.00,10.688507,2.338961,Units issued,2026-04-14,Spaceship Universe Portfolio
2026-04-06,Investment plan (weekly),Paid,25.00,10.764277,2.322497,Units issued,2026-04-07,Spaceship Universe Portfolio
2026-03-30,Investment plan (weekly),Paid,25.00,10.842088,2.305829,Units issued,2026-03-31,Spaceship Universe Portfolio
2026-03-23,Investment plan (weekly),Paid,25.00,10.920707,2.289229,Units issued,2026-03-24,Spaceship Universe Portfolio
2026-03-16,Investment plan (weekly),Paid,25.00,10.998845,2.272966,Units issued,2026-03-17,Spaceship Universe Portfolio
2026-03-09,Investment plan (weekly),Paid,25.00,11.075154,2.257305,Units issued,2026-03-10,Spaceship Universe Portfolio
2026-03-02,Investment plan (weekly),Paid,25.00,11.148272,2.242500,Units issued,2026-03-03,Spaceship Universe Portfolio
2026-02-23,Investment plan (weekly),Paid,25.00,11.216828,2.228794,Units issued,2026-02-24,Spaceship Universe Portfolio
2026-02-16,Investment plan (weekly),Paid,25.00,11.279481,2.216414,Units issued,2026-02-17,Spaceship Universe Portfolio
2026-02-09,Investment plan (weekly),Paid,25.00,11.334974,2.205563,Units issued,2026-02-10,Spaceship Universe Portfolio
2026-02-02,Investment plan (weekly),Paid,25.00,11.382138,2.196424,Units issued,2026-02-03,Spaceship Universe Portfolio
2026-01-26,Investment plan (weekly),Paid,50.00,22.839863,2.189155,Units issued,2026-01-27,Spaceship Universe Portfolio
2026-01-19,Investment plan (weekly),Paid,50.00,22.895010,2.183882,Units issued,2026-01-20,Spaceship Universe Portfolio
2026-01-12,Investment plan (weekly),Paid,50.00,22.928375,2.180704,Units issued,2026-01-13,Spaceship Universe Portfolio
2026-01-05,Investment plan (weekly),Paid,50.00,22.939073,2.179687,Units issued,2026-01-06,Spaceship Universe Portfolio
2025-12-29,Investment plan (weekly),Paid,50.00,22.926704,2.180863,Units issued,2025-12-30,Spaceship Universe Portfolio
2025-12-22,Investment plan (weekly),Paid,50.00,22.891320,2.184234,Units issued,2025-12-23,Spaceship Universe Portfolio
2025-12-15,Investment plan (weekly),Paid,50.00,22.833500,2.189765,Units issued,2025-12-16,Spaceship Universe Portfolio
2025-12-08,Investment plan (weekly),Paid,50.00,22.754268,2.197390,Units issued,2025-12-09,Spaceship Universe Portfolio
2025-12-01,Investment plan (weekly),Paid,25.00,11.327527,2.207013,Units issued,2025-12-02,Spaceship Universe Portfolio
2025-11-24,Investment plan (weekly),Paid,25.00,11.268855,2.218504,Units issued,2025-11-25,Spaceship Universe Portfolio
2025-11-17,Investment plan (weekly),Paid,25.00,11.202182,2.231708,Units issued,2025-11-18,Spaceship Universe Portfolio
2025-11-10,Investment plan (weekly),Paid,25.00,11.128709,2.246442,Units issued,2025-11-11,Spaceship Universe Portfolio
2025-11-03,Investment plan (weekly),Paid,25.00,11.049724,2.262500,Units issued,2025-11-04,Spaceship Universe Portfolio
2025-10-27,Investment plan (weekly),Paid,25.00,10.966557,2.279658,Units issued,2025-10-28,Spaceship Universe Portfolio
2025-10-20,Investment plan (weekly),Paid,25.00,10.880578,2.297672,Units issued,2025-10-21,Spaceship Universe Portfolio
2025-10-13,Investment plan (weekly),Paid,25.00,10.793131,2.316288,Units issued,2025-10-14,Spaceship Universe Portfolio
2025-10-06,Investment plan (weekly),Paid,25.00,10.705533,2.335241,Units issued,2025-10-07,Spaceship Universe Portfolio
2025-09-29,Investment plan (weekly),Paid,25.00,10.619044,2.354261,Units issued,2025-09-30,Spaceship Universe Portfolio
2025-09-22,Investment plan (weekly),Paid,25.00,10.534837,2.373079,Units issued,2025-09-23,Spaceship Universe Portfolio
2025-09-15,Investment plan (weekly),Paid,25.00,10.454009,2.391427,Units issued,2025-09-16,Spaceship Universe Portfolio
2025-09-08,Investment plan (weekly),Paid,25.00,10.377561,2.409044,Units issued,2025-09-09,Spaceship Universe Portfolio
2025-09-01,Investment plan (weekly),Paid,25.00,10.306384,2.425681,Units issued,2025-09-02,Spaceship Universe Portfolio
2025-08-25,Investment plan (weekly),Paid,25.00,10.241268,2.441104,Units issued,2025-08-26,Spaceship Universe Portfolio
2025-08-18,Investment plan (weekly),Paid,25.00,10.182897,2.455097,Units issued,2025-08-19,Spaceship Universe Portfolio
2025-08-11,Investment plan (weekly),Paid,25.00,10.131852,2.467466,Units issued,2025-08-12,Spaceship Universe Portfolio
2025-08-04,Investment plan (weekly),Paid,25.00,10.088614,2.478041,Units issued,2025-08-05,Spaceship Universe Portfolio
2025-07-28,Investment plan (weekly),Paid,25.00,10.053569,2.486679,Units issued,2025-07-29,Spaceship Universe Portfolio
2025-07-21,Investment plan (weekly),Paid,25.00,10.027001,2.493268,Units issued,2025-07-22,Spaceship Universe Portfolio
2025-07-14,Investment plan (weekly),Paid,25.00,10.009108,2.497725,Units issued,2025-07-15,Spaceship Universe Portfolio
2025-07-07,Investment plan (weekly),Paid,25.00,10.000000,2.500000,Units issued,2025-07-08,Spaceship Universe Portfolio
`;
