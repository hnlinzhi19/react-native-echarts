import echarts from './echarts.min';
import toString from '../../util/toString';

export default function renderChart(props) {
  const height = `${props.height || 400}px`;
  const width = props.width ? `${props.width}px` : 'auto';
  return `
    document.getElementById('main').style.height = "${height}";
    document.getElementById('main').style.width = "${width}";
    var myChart = echarts.init(document.getElementById('main'));
    window.myChart = myChart;
    myChart.setOption(${toString(props.option)});
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
    hammertime.on('tap', function(ev){
      ev.preventDefault();
      console.log('tap',ev);
      var targetPx =myChart.convertFromPixel({seriesIndex: 0}, [ev.center.x, ev.center.y]);
      sendMessage({currentPoint:targetPx});
      myChart.dispatchAction({
        type: 'showTip',
        x: ev.center.x,
        y: ev.center.y,
      });
    
    });
    hammertime.on('panmove', (ev) =>{
      ev.preventDefault();
      var targetPx =myChart.convertFromPixel({seriesIndex: 0}, [ev.center.x, ev.center.y]);
      sendMessage({currentPoint:targetPx});
      myChart.dispatchAction({
        type: 'showTip',
        x:ev.center.x,
        y:ev.center.y,
      });
    });
    // myChart.on('finished',function(){
    //   console.log('finished);
    // });
    // myChart.on('click', function(params) {
    //   var seen = [];
    //   var paramsString = JSON.stringify(params, function(key, val) {
    //     if (val != null && typeof val == "object") {
    //       if (seen.indexOf(val) >= 0) {
    //         return;
    //       }
    //       seen.push(val);
    //     }
    //     return val;
    //   });
    //   window.postMessage(paramsString);
    // });
  `
  }