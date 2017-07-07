d3.json('data/sample.json', function(error, data) {

    if (error) {
        console.error(error);
    }

    // var chart = new LineChart(JSON.parse(JSON.stringify(data)))
    var chart = new LineChart()
        .setCapacity(10)
        .renderTo('#lineChart');

    var dataPoint = data[data.length - 1];

    dataPoint = getNextDataSet(dataPoint);
    chart.update([dataPoint])
    dataPoint = getNextDataSet(dataPoint);
    chart.update([dataPoint])

    setInterval(function() {
        dataPoint = getNextDataSet(dataPoint);
        chart.update([dataPoint])
    }, 1500);
});


function getNextDataSet(dataPoint, i) {

    dataPoint = JSON.parse(JSON.stringify(dataPoint));

    dataPoint.date = moment(new Date(dataPoint.date)).add(1, 'h').format('MMM D, YYYY HH:mm');
    dataPoint.price = Math.random() - 0.5;

    return dataPoint;
}
