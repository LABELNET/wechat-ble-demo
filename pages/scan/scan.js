// pages/scan/scan.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    bleStatus:"蓝牙未打开",
    bleAdapterStatus:"未初始化",
    bleChipInfo:{},
    bleChips:[],
    bleConnSuccess:false,
    bleNotifyData:"未读取数据"
  },

  /**
   * 开始扫描
   */
  onScanClick:function(event){
    console.log('扫描开始')
    let self = this
    wx.openBluetoothAdapter({
      success: function(res) {
        // 扫描蓝牙
        self.bleDisCovery()
        self.setData({
          bleAdapterStatus:"初始化成功"
        })
      },
      fail:function(error){
        self.setData({
          bleAdapterStatus: "初始化失败"
        })
        wx.showModal({
          showCancel: false,
          title: '提示',
          content: '设备蓝牙未打开，请打开蓝牙功能',
          success: function (res) {
            if (res.confirm) {
              //console.log('用户点击确定')
            }
          }
        });
      },
      complete:function(){
        //console.log('complete')
      }
    });
  },
  /**
   * 解析数据信息
   */
  bleFound:function(){
    console.log("发现设备信息")
    let self =this
    wx.onBluetoothDeviceFound(function (res) {
      let devices = res.devices
      console.log(devices)
      let length = self.data.bleChips.length
      let devicesLength = devices.length
      if (devicesLength > length){
        self.data.bleChips = devices
        self.setData({
          bleChips: devices
        });
      }
      console.log(self.data.bleChips)
    });
   
  },
  /**
   * 扫描设备
   */
  bleDisCovery:function(){
    console.log("扫描蓝牙")
    let self = this
     wx.startBluetoothDevicesDiscovery({
          interval:1000,
          success: function(res){
            self.bleFound();
          }
        });
  },
  /**
   * 初始化蓝牙
   */
  bleInit:function(){
    console.log('初始化蓝牙')
    let self = this
    wx.openBluetoothAdapter({
      success: function(res) {
        self.setData({
          bleAdapterStatus: "初始化成功"
        })
      },
      fail:function(msg){
        self.setData({
          bleAdapterStatus: "初始化失败"
        })
        wx.showModal({
          showCancel:false,
          title: '提示',
          content: '设备蓝牙未打开，请打开蓝牙功能',
          success:function(res){
            if (res.confirm) {
              //console.log('用户点击确定')
              // 退出小程序
            }
          }
        });
      }
    });
  },
  /**
   * 蓝牙设备监听
   */
  bleStatusListener:function(){
    // 监听蓝牙状态
    let slef =this
    wx.onBluetoothAdapterStateChange(function (res) {
      console.log(`adapterState changed, now is`, res)
      if (res.available){
        // 是否可用
        console.log("蓝牙状态以改变！")
        slef.setData({
          bleStatus: "蓝牙已打开"
        });
      }else{
        slef.setData({
          bleStatus: "蓝牙已关闭"
        });
        // 不可用时
        wx.showModal({
          showCancel: false,
          title: '提示',
          content: '设备蓝牙未打开，请打开蓝牙功能',
          success: function (res) {
            if (res.confirm) {
              // console.log('用户点击确定')
              // 退出小程序
            }
          }
        });
      }
    });
  },
  onConnBle:function(e){
    // 停止扫描
    wx.stopBluetoothDevicesDiscovery({
      success: function(res) {
      },
    });
    // 接收点击事件的参数
    let device = e.currentTarget.dataset.item
    console.log(`conn ble >> ${device}`)
    this.setData({
      bleChipInfo: device
    })
    let deviceId = device.deviceId
    let self = this
    // 连接设备
    console.log("连接设备中...")
    wx.createBLEConnection({
      deviceId: deviceId,
      success: function(res) {
        wx.showToast({
          title: '连接成功',
        });
        // 连接成功，打开 notify
        setTimeout(function(){
          self.bleServices(deviceId)
        },1500)
       
      },
      fail:function(errMsg){
        wx.showToast({
          title: `连接失败:${errMsg}`,
        })
      }
    });
  },
  bleServices: function (deviceId){
    let self = this
    wx.getBLEDeviceServices({
      deviceId: deviceId,
      success: function (res) {
        wx.showToast({
          title: 'service success',
        })
        let services = res.services
        for(let index in services){
          let service= services[index]
          console.log(service)
          if (service.uuid === '49535343-FE7D-4AE5-8FA9-9FAFD205E455'){
            console.log("have service: 49535343-FE7D-4AE5-8FA9-9FAFD205E455")
            self.bleServiceChart(deviceId, service.uuid)
          }
        }       
        console.log('device services:', res.services)
      }
    })
  },
  bleServiceChart: function (deviceId,serviceId){
    let self = this;
    wx.getBLEDeviceCharacteristics({
      // 这里的 deviceId 需要在上面的 getBluetoothDevices 或 onBluetoothDeviceFound 接口中获取
      deviceId: deviceId,
      // 这里的 serviceId 需要在上面的 getBLEDeviceServices 接口中获取
      serviceId: serviceId,
      success: function (res) {
        console.log('device getBLEDeviceCharacteristics:', res.characteristics)
        let characteristics = res.characteristics
        for (let index in characteristics){
          let characteristic = characteristics[index]
          if (characteristic.uuid === '49535343-1E4D-4BD9-BA61-23C647249616'){
            console.log("have characteristic: 49535343-1E4D-4BD9-BA61-23C647249616")
          }
          console.log(characteristic)
        }
        self.openNotify(deviceId) 
      }
    })
  },
  openNotify: function (deviceId) {
    this.setData({
      bleConnSuccess: true
    });
    let self = this
    wx.notifyBLECharacteristicValueChange({
      deviceId: deviceId,
      serviceId: '49535343-FE7D-4AE5-8FA9-9FAFD205E455',
      characteristicId: '49535343-1E4D-4BD9-BA61-23C647249616',
      state: true,
      success: function (res) {
        console.log('notify success')
        self.onNotifyChange()
        wx.showToast({
          title: 'notify success',
        });
      },
      fail: function (err) {
        console.log(err)
        wx.showToast({
          title: 'notify fail',
        });
      }
    });
  },
  onNotifyChange:function(){
    // 接收数据
    let self = this
    wx.onBLECharacteristicValueChange(function (res) {
      console.log(res.characteristicId)
      let byteDatas = Array.from(new Int8Array(res.value))
      console.log(byteDatas)
      const data = byteDatas.join(',')
      self.setData({
        bleNotifyData:data
      });
      console.log(data)
    });
  },
  
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    if (wx.openBluetoothAdapter) {
      wx.openBluetoothAdapter()
    } else {
      wx.showModal({
        title: '提示',
        content: '当前微信版本过低，无法使用该功能，请升级到最新微信版本后重试。'
      })
    }
  },


  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    // 监听蓝牙
    this.bleStatusListener()
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    // 初始化蓝牙
     this.bleInit()
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
  
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    wx.closeBluetoothAdapter({
      success: function(res) {
      
      },
    });
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
  
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
  
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
  
  }
})