import echarts from './echarts.min';
import toString from '../../util/toString';

export default function renderChart(props) {
  const height = `${props.height || 400}px`;
  const width = props.width ? `${props.width}px` : 'auto';
  console.log(props);
  const chartType = props.chartType || ''
  return `
     var originOption = ${toString(props.option)};
     var allDates = ${toString(props.dates || [])};
     var currentType = ${toString(chartType)};

    document.getElementById('main').style.height = "${height}";
    document.getElementById('main').style.width = "${width}";
    var myChart = echarts.init(document.getElementById('main'));
    window.myChart = myChart;
    myChart.setOption(originOption);
    console.log(originOption);
    window.document.addEventListener('message', function(e) {
      console.log(e);
      var option = JSON.parse(e.data);
      if (option.type) {
        switch(option.type){
          case 'chartLegendChange': 
            console.log('change setting',);
            eval(option.settings);
            myChart.dispatchAction({
              type: 'hideTip',
            });
            break;
          case 'getKlineType':
            window.getCurrentPointCb(option);
            break;
          default:
        }
      }  else {
        myChart.setOption(option);
      }
    });
    const canvas = myChart.getZr().dom.querySelector('canvas');
    var hammertime = new Hammer(canvas, {});

    function sendMessage(params){
      var seen = [];
      var paramsString = JSON.stringify(params, function(key, val) {
        if (val != null && typeof val == "object") {
          if (seen.indexOf(val) >= 0) {
            return;
          }
          seen.push(val);
        }
        return val;
      });
      window.postMessage(paramsString);
    }
    // 获取指标
    function getCurrentPoint (){
      return new Promise(function(resolve){
        window.getCurrentPointCb = function(e){
          resolve(e)
        }
      })
    }
    var chartTopSelectMod = ['ma7','ma15','ma30','upper','middle','lower'];
    var chartBottomSelectMod = {
      bottom: ['Volume'],
      kdj:['d','k'],
      macd:['MACD','DEA','DIF'],
      rsi:['RSI24','RSI12','RSI6'],
      wr:['WR10','WR6']
    };
    // 显示 type ma 就是显示ma
    function selectTopType (type) {
      // chartTopSelectMod
      var legendSelectString = '';
      var otherLegendSelectString = '';
      if (type === 'ma') {
        legendSelectString = 'legendSelect';
        otherLegendSelectString = 'legendUnSelect';
      } else {
        otherLegendSelectString = 'legendSelect';
        legendSelectString= 'legendUnSelect';
      }
      for (var i =0,len= chartTopSelectMod.length;i<len; i++) {
        if (chartTopSelectMod[i].indexOf('ma') > -1) {
          myChart.dispatchAction({
            type: legendSelectString,
            name: chartTopSelectMod[i]
          });
        } else {
          myChart.dispatchAction({
            type: otherLegendSelectString,
            name: chartTopSelectMod[i]
          });
        }
      }
    }
    
    // 只显示一个
    function onlyTopChart () {
      for (var i =0,len= chartTopSelectMod.length;i<len; i++) {
        myChart.dispatchAction({
          type: 'legendUnSelect',
          name: chartTopSelectMod[i]
        });
      }
    }
    // 换bottomchart
    function changeBottomChart(type){
      for (var key in chartBottomSelectMod) {
        var tmpArray = chartBottomSelectMod[key];
        if (key === type) {
          for (var j =0;j<tmpArray.length;j++) {
            myChart.dispatchAction({
              type: 'legendSelect',
              name: tmpArray[j]
            });
          }
        } else {
          for (var j =0;j<tmpArray.length;j++) {
            myChart.dispatchAction({
              type: 'legendUnSelect',
              name: tmpArray[j]
            });
          }
        }
      }
    }
// 切换k线的显示
    function changeSelectedLegen (center){
      console.log(111);
      getCurrentPoint().then(function(e){
        console.log('test',e);
        var topType = e.chartTopType;
        var bottomType = e.chartBottomType;
        if (topType) {
          switch(topType){
            case 'ma':
              selectTopType('ma');
              break;
            case 'bolling':
              selectTopType('boll');
              break;
            default:
              onlyTopChart();
          }
        } 

        if (bottomType) {
          changeBottomChart(bottomType);
        }
      });
      var gridTop = originOption.grid[0];
      var gridBottom = originOption.grid[1];
      if (center.y >= gridTop.top && center.y <= gridTop.top + gridTop.height){
        sendMessage({
          type: 'klinePointChangeTop',
        });
      } else if (center.y >= gridBottom.top && center.y <= gridBottom.top + gridBottom.height) {
        // klinePointChangeBottom
        sendMessage({
          type: 'klinePointChangeBottom',
        });
      }
      
    }
    
    hammertime.on('tap', function(ev){
      ev.preventDefault();
      console.log('tap',ev);
      var targetPx =myChart.convertFromPixel({seriesIndex: 0}, [ev.center.x, ev.center.y]);
      if (currentType === 'kline') {
        changeSelectedLegen(ev.center);
        if (allDates && allDates.length) {
          myChart.dispatchAction({
            type: 'showTip',
            x: allDates.length - 1,
            y: 0
          });
        } 
        
      }else {
        sendMessage({currentPoint:targetPx});
        myChart.dispatchAction({
          type: 'showTip',
          x: ev.center.x,
          y: ev.center.y,
        });
      }
    });
    hammertime.on('panmove', (ev) =>{
      ev.preventDefault();
      var targetPx =myChart.convertFromPixel({seriesIndex: 0}, [ev.center.x, ev.center.y]);
      sendMessage({currentPoint:targetPx});
      if (currentType === 'kline') {
        console.log('kline')
        if (isPressed) {
          var x = ev.center.x;
          var y = ev.center.y;
          myChart.dispatchAction({
            type: 'showTip',
            x:x,
            y:y,
          });
        }
      }else {
        myChart.dispatchAction({
          type: 'showTip',
          x:ev.center.x,
          y:ev.center.y,
        });
      }
    });
    var isPressed = false;
    // 长按
    hammertime.get('press').set({ time: 500});
    hammertime.on('press', (ev) =>{
      if (currentType === 'kline') {
        isPressed = true;
        var x = ev.center.x;
        var y = ev.center.y;
        myChart.dispatchAction({
          type: 'showTip',
          x:x,
          y:y,
        });
      }
    });
    myChart.on('showTip',function(e){
      if (currentType === 'kline') {
        console.log('showTip',e);
        sendMessage({type: 'showTip',data:e});
      }
    })
  `
  }