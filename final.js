import csvToJson from "csvtojson";
import fs from 'fs'

function getHaversineDistance(coordinate1, coordinate2) {
    var lon1 = coordinate1.lng;
    var lat1 = coordinate1.lat;
    var lon2 = coordinate2.lng;
    var lat2 = coordinate2.lat;

    var R = 6371; // km

    var x1 = lat2 - lat1;
    var dLat = toRad(x1);
    var x2 = lon2 - lon1;
    var dLon = toRad(x2);

    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var     d = R * c;
    return d;
}

function toRad(x) {
    return (x * Math.PI) / 180;
}

async  function find (){
    
        let df = await csvToJson().fromFile("./Data_1.csv");
        let nonZeroData = df.filter(item => item['lat'] > 0);

        let id_list=[...new Set (nonZeroData.map(item=>item['uniqueid']))]
        // console.log(id_list)
        let obj={}
        let obj_halt={}
        for(let i=0;i<id_list.length;i++)//change
        {
            // console.log(id_list[i])
            let running=0;
            let halt=0;
            // obj[id_list[i]] = 0;
            obj[id_list[i]] = [];
            // obj_halt[id_list[i]] = [];
            let veh_data=nonZeroData.filter(item=>item['uniqueid']==id_list[i])
            // console.log(veh_data)
            for(let j=0;j<veh_data.length;j++){
                if(parseInt(veh_data[j]['event_flag']&1024)==1024 && parseInt(veh_data[j]['speed'])>3){
                    if(j!=veh_data.length-1){
                        if(parseInt(veh_data[j+1]['event_flag']&1024)==1024 && parseInt(veh_data[j+1]['speed'])>3){
                            running+=getHaversineDistance(veh_data[j],veh_data[j+1])
                        }
                        else{
                            let ob1={}
                            ob1['Status']="Running",
                            ob1['Distance']=running
                            obj[id_list[i]].push(ob1)
                            running=0;                          
                        }
                    }
                    else{
                        let ob1={}
                        ob1['Status']="Running",
                        ob1['Distance']=running
                        obj[id_list[i]].push(ob1)
                        running=0;                          
                    }
                }
                else if(parseInt(veh_data[j]['event_flag']&4096)==4096){
                    if(j!=veh_data.length-1){
                        if(parseInt(veh_data[j+1]['event_flag']&4096)==4096){
                            halt+=getHaversineDistance(veh_data[j],veh_data[j+1])
                        }
                        else{
                            let ob2={}
                            ob2['Status']='Halt',
                            ob2['Distance']=halt
                            obj[id_list[i]].push(ob2)
                            halt=0;                            
                        }
                    }
                    else{
                        let ob2={}
                        ob2['Status']='Halt',
                        ob2['Distance']=halt
                        obj[id_list[i]].push(ob2)
                        halt=0;                            
                    }
                }   
                else{
                    let ob3={}
                    ob3['Status']="Idle",
                    ob3["Distance"]=0
                    obj[id_list[i]].push(ob3)

                }
            }
        }
        // console.log(obj)
        let newArr=[]
        for(let key in obj){
            let temp = obj[key].sort((a,b)=>{return b.Distance-a.Distance})[0]
            // console.log(temp.Status,temp.Distance)
            let temp1_obj={
                'uniqueid':key, 
            }
            if(temp.Status=='Running'){
                temp1_obj[temp.Status] = temp['Distance']
                temp1_obj['Halt']=0
            }
            if(temp.Status=='Halt'){
                temp1_obj[temp.Status] = temp['Distance']
                temp1_obj['Running']=0
            }
            if(temp.Status=='Idle'){
                temp1_obj['Halt']=0,
                temp1_obj['Running']=0
            }
            newArr.push(temp1_obj)            
         }
        // console.log(JSON.stringify(newArr))
        // return newArr;
        // console.log(newArr)
        fs.writeFileSync('Longest_journey.json',JSON.stringify(newArr),'utf8',function(err){
            if(err){
                console.log(err);
            }
        })
}

find()
