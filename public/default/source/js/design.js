/**
 * Created by karl on 2017/5/1.
 */
"use strict"
jQuery(document).ready(function ($) {

    // 当前已选选型方案
    var recordObj = undefined

    $(function () {
        // // TODO 待处理 模块数量为空时提示
        // $('#name').keyup(function () {
        //     if ($(this).val() == '') {
        //         $("#msg_name").text('请输入模块数量')
        //         return;
        //     }
        //     $("#msg_name").text('')
        // })
        // 是否为存在记录, 支持重选修改表单
        if (recordStr) {
            recordObj = JSON.parse(recordStr)
            console.log("recordObj>>>>>",recordObj)
            console.log("2",recordObj.optionList[0].totalPrice)
            // 更改网页标题, 兼容微信分享有标识
            var title = recordObj.stationName + ' - 智选优设'
            $("title").html(title)
            document.title = title
            var AH1,AH2,AH3,AH,AI1,AI2,AI
            var differenceRate = $(".differenceRate") //校正后造价综合差异率*100
            var investment = $(".investment") //校正后百元投资租金/年（元）
            var correctProfit = $(".correctProfit") //校正后毛利率*100
            var target = $(".actual")
            var txt = target.text()
            var rate = Math.round(parseFloat(txt/recordObj.optionList[0].totalPrice)*100)
            var investmentTotal = (recordObj.optionList[0].machineRoomPrice+recordObj.optionList[0].towerNormalPrice+recordObj.optionList[0].upkeep)/10000
            if(txt == 0){
                investment.html("0")
                correctProfit.html("0")
            }else{
                investment.html(parseFloat(investmentTotal/txt*100*recordObj.optionList[0].towerShareSum).toFixed(2))
                //AH
                AH1 = txt*recordObj.optionList[0].towerCost/recordObj.optionList[0].totalCost/10
                AH2 = txt*recordObj.optionList[0].roomCost/recordObj.optionList[0].totalCost/20
                AH3 = txt*recordObj.optionList[0].suitCost/recordObj.optionList[0].totalCost/6
                AH = (AH1+AH2+AH3)*10000
                //AI
                AI1 = (recordObj.optionList[0].towerNormalPrice + recordObj.optionList[0].machineRoomPrice)*recordObj.optionList[0].towerShareSum - AH
                AI2 = AH + recordObj.optionList[0].upkeep + recordObj.optionList[0].electric + recordObj.optionList[0].site
                AI = (Number(AI1/AI2)*100).toFixed(2)
                correctProfit.html(AI + "%")
            }
            differenceRate.html(rate)
        }


        //填写校正后的实际建设成本
        $(".actual").click(function () {
            var input = $("<input style='width:35%;margin-left:8px;border:1px solid #fff;border-radius: 4px;' type='number' value='" + txt + "'/>");
            target.html(input)
            input.click(function () {
                return false;
            })
            // 获取焦点
            input.trigger("focus");
            // 文本框失去焦点后提交内容，重新变为文本
            input.blur(function () {
                var newtxt = $(this).val();
                // 判断文本有没有修改
                if (newtxt !== "") {
                    target.html(newtxt)
                    rate = Math.round(parseFloat(newtxt/recordObj.optionList[0].totalPrice)*100)
                    differenceRate.html(rate)
                    investment.html(parseFloat(investmentTotal/newtxt*100*recordObj.optionList[0].towerShareSum).toFixed(2))

                    //AH
                    AH1 = newtxt*recordObj.optionList[0].towerCost/recordObj.optionList[0].totalCost/10
                    AH2 = newtxt*recordObj.optionList[0].roomCost/recordObj.optionList[0].totalCost/20
                    AH3 = newtxt*recordObj.optionList[0].suitCost/recordObj.optionList[0].totalCost/6
                    AH = (AH1+AH2+AH3)*10000
                    console.log("AH",AH)
                    console.log("AH1",AH1)
                    console.log("AH2",AH2)
                    console.log("AH3",AH3)
                    //AI
                    AI1 = (recordObj.optionList[0].towerNormalPrice + recordObj.optionList[0].machineRoomPrice)*recordObj.optionList[0].towerShareSum - AH
                    AI2 = AH + recordObj.optionList[0].upkeep + recordObj.optionList[0].electric + recordObj.optionList[0].site
                    AI = (Number(AI1/AI2)*100).toFixed(2)
                    console.log("upkeep",recordObj.optionList[0].upkeep)
                    console.log("ele",recordObj.optionList[0].electric)
                    console.log("site",recordObj.optionList[0].site)
                    console.log("ai2>>>>>>>>>>>>>>>>>",AI2)
                    console.log("ai1>>>>>>>>>>>>>>>>>",AI1)
                    console.log("ai>>>>>>>>>>>>>>>>>",AI)
                    correctProfit.html(AI + "%")
                } else {
                    target.html(txt)
                }
            })
        })
        // 获取class为caname的元素, 点击文字input框修改值 物资数量
        $(".caname").click(function () {
            var target = $(this)
            var txt = target.text()
            var input = $("<input style='margin-left:8px;border:1px solid #fff;border-radius: 4px;' type='number' value='" + txt + "'/>");
            target.html(input)
            input.click(function () {
                return false;
            })
            // 获取焦点
            input.trigger("focus");
            // 文本框失去焦点后提交内容，重新变为文本
            input.blur(function () {
                var newtxt = $(this).val();
                // 判断文本有没有修改
                if (newtxt != txt && newtxt !== null) {
                    target.html(newtxt)
                    var dataType = target.attr("data-type")
                    var optionIndex = target.attr("data-option-index")
                    var planIndex = target.attr("data-plan-index")
                    var moduleIndex = target.attr("data-module-index")
                    var moduleObj = recordObj.optionList[optionIndex].planList[planIndex].moduleList[moduleIndex]
                    if (dataType == 'material') {
                        moduleObj.materialCount = newtxt
                    } else if (dataType == 'service') {
                        moduleObj.serviceCount = newtxt
                    }
                } else {
                    target.html(txt)
                }
            })
        })
    })

    // 先根据模块id对应的物资或服务类型
    // 再弹窗后请求数据, 显示加载中字样
    // 后点击某项, 修改对应位置和对象值
    function openModulePopup(target) {
        var dataType = target.attr("data-type")
        var optionIndex = target.attr("data-option-index")
        var planIndex = target.attr("data-plan-index")
        var moduleIndex = target.attr("data-module-index")
        var moduleObj = recordObj.optionList[optionIndex].planList[planIndex].moduleList[moduleIndex]

        $.getScript("/common/js/layer.min.js?v={{APPVersion}}", function () {
            // 页面层
            layer.open({
                type: 1,
                btns: 1,
                btn: ['不改变并关闭'],
                btnAlign: 'c',// 按钮居中
                content: '<div class="scheme change" style="padding: 2rem 0 1rem;background: rgb(50, 50, 50);color: #fff">' +
                '<div class="search">' +
                '<form>' +
                '<input type="text" placeholder="搜索从这里开始..." id="txtKeyword">' +
                '<button type="button" id="btnSearch"></button>' +
                '</form>' +
                '</div>' +
                '<div id="search" class="search_list">' +
                '<ul class="j-module-data">' +
                '</ul>' +
                '</div>' +
                '</div>',
                yes: function () {
                    layer.closeAll()
                    $.getScript("/common/js/layer.js?v={{APPVersion}}")
                }
            })

            $('#btnSearch').click(function () {
                // 请求api
                callModules(dataType, $('#txtKeyword').val())
            })

            // 请求模块数据接口
            function callModules(type, keyword) {
                var formData = {}
                var limit = 20
                if (keyword) {
                    formData.keywords = []
                    formData.keywords.push(keyword)
                    limit = 99999// 搜索时不限制输出条数
                }
                console.log("formData",formData)
                $.ajax({
                    url: globalApiUrl + '/api/schema/find.html',
                    contentType: 'application/x-www-form-urlencoded',
                    type: 'post',
                    data: {
                        schema: type,
                        data: JSON.stringify(formData),
                        sort: '{"time": -1}',
                        page: 0,
                        limit: limit// TODO 暂时不支持分页
                    },
                    dataType: 'json',
                    beforeSend: function () {
                        // 请求前
                        var emptyHtml = '<li style="text-align: center;"><p>加载数据中, 请稍候......</p></li>'
                        $('.j-module-data').html(emptyHtml)
                        // 自定义弹窗 id>search 高度大于310px 加上垂直滚动条
                        var search = document.getElementById("search")
                        if (search.offsetHeight > '310') {
                            $('#search').css('height', '310px')
                            $('#search').css('overflow-y', 'scroll')
                        }
                    },
                    complete: function () {
                        // 请求后
                        $('.j-module-item').click(function () {
                            // 先赋值
                            if (dataType == 'material') {
                                moduleObj.materialCode = $(this).attr("data-code")
                                moduleObj.materialPrice = $(this).attr("data-price")
                                moduleObj.materialRate = $(this).attr("data-rate")
                                moduleObj.materialCount = $(this).attr("data-count")
                                moduleObj.materialUnit = $(this).attr("data-unit")
                                moduleObj.materialDescription = $(this).attr("data-description")
                            } else if (dataType == 'service') {
                                moduleObj.serviceCode = $(this).attr("data-code")
                                moduleObj.servicePrice = $(this).attr("data-price")
                                moduleObj.serviceRate = $(this).attr("data-rate")
                                moduleObj.serviceCount = $(this).attr("data-count")
                                moduleObj.serviceUnit = $(this).attr("data-unit")
                                moduleObj.serviceDescription = $(this).attr("data-description")
                            }
                            // 再修改界面
                            $('.j-data-module-' + moduleIndex + ' .j-material-code').html(moduleObj.materialCode)
                            $('.j-data-module-' + moduleIndex + ' .j-material-price').html(moduleObj.materialPrice)
                            $('.j-data-module-' + moduleIndex + ' .j-material-rate').html(moduleObj.materialRate)
                            $('.j-data-module-' + moduleIndex + ' .j-material-count').html(moduleObj.materialCount)
                            $('.j-data-module-' + moduleIndex + ' .j-material-unit').html(moduleObj.materialUnit)
                            $('.j-data-module-' + moduleIndex + ' .j-material-description').html(moduleObj.materialDescription)
                            $('.j-data-module-' + moduleIndex + ' .j-service-code').html(moduleObj.serviceCode)
                            $('.j-data-module-' + moduleIndex + ' .j-service-price').html(moduleObj.servicePrice)
                            $('.j-data-module-' + moduleIndex + ' .j-service-rate').html(moduleObj.serviceRate)
                            $('.j-data-module-' + moduleIndex + ' .j-service-count').html(moduleObj.serviceCount)
                            $('.j-data-module-' + moduleIndex + ' .j-service-unit').html(moduleObj.serviceUnit)
                            $('.j-data-module-' + moduleIndex + ' .j-service-description').html(moduleObj.serviceDescription)
                            // 后关闭弹窗
                            layer.closeAll()
                            $.getScript("/common/js/layer.js?v={{APPVersion}}")
                        })
                    },
                    success: function (response) {
                        var messageHtml = '<li style="text-align: center;"><p>' + response.message + '</p></li>'
                        // 响应成功
                        if (response.state == 1) {
                            var dataHtml = messageHtml
                            for (var i = 0; i < response.data.length; i++) {
                                if (dataType == 'material') {
                                    var material = response.data[i]
                                    var materialCode = (material.materialCode ? material.materialCode : '')
                                    var materialPrice = (material.price ? material.price : '')
                                    var materialRate = (material.rate ? material.rate : '')
                                    var materialCount = ''
                                    var materialUnit = (material.materialUnit ? material.materialUnit : '')
                                    var materialDescription = material ? ((material.classAssetDescription ? material.classAssetDescription : '') + '-' + (material.itemAssetDescription ? material.itemAssetDescription : '') + '-' + (material.meshAssetDescription ? material.meshAssetDescription : '') + '-' + (material.nodeAssetDescription ? material.nodeAssetDescription : '') + '-' + (material.subClassAssetDescription ? material.subClassAssetDescription : '') + '-' + (material.subItemAssetDescription ? material.subItemAssetDescription : '') + '-' + (material.subMeshAssetDescription ? material.subMeshAssetDescription : '')) : ''
                                    dataHtml += '<li class="j-module-item" data-code="' + materialCode + '" data-price="' + materialPrice + '"  data-rate="' + materialRate + '"  data-count="' + materialCount + '"  data-unit="' + materialUnit + '"  data-description="' + materialDescription + '">' +
                                        '<p><span>物资编码</span> : ' + materialCode + '</p>' +
                                        '<p><span>物资单价</span> : ' + materialPrice + '</p>' +
                                        '<p><span>物资税率</span> : ' + materialRate + '</p>' +
                                        '<p><span>计量单位</span> : ' + materialUnit + '</p>' +
                                        '<p><span>物资说明</span> : ' + materialDescription + '</p>' +
                                        '</li>'
                                } else if (dataType == 'service') {
                                    var service = response.data[i]
                                    console.log("service",service)
                                    var serviceCode = (service.serviceCode ? service.serviceCode : '')
                                    var servicePrice = (service.price ? service.price : '')
                                    var serviceRate = (service.rate ? service.rate : '')
                                    var serviceCount = ''
                                    var serviceUnit = (service.serviceUnit ? service.serviceUnit : '')
                                    var serviceDescription = service ? ((service.classAssetDescription ? service.classAssetDescription: '') + '-' + (service.itemAssetDescription ? service.itemAssetDescription : '') + '-' + (service.meshAssetDescription ? service.meshAssetDescription : '') + '-' + (service.nodeAssetDescription ? service.nodeAssetDescription : '') + '-' + (service.subClassAssetDescription ? service.subClassAssetDescription : '') + '-' + (service.subItemAssetDescription ? service.subItemAssetDescription : '')) : ''
                                    console.log("serviceDescription",serviceDescription)
                                    dataHtml += '<li class="j-module-item" data-code="' + serviceCode + '" data-price="' + servicePrice + '"  data-rate="' + serviceRate + '"  data-count="' + serviceCount + '"  data-unit="' + serviceUnit + '"  data-description="' + serviceDescription + '">' +
                                        '<p><span>服务编码</span> : ' + serviceCode + '</p>' +
                                        '<p><span>服务单价</span> : ' + servicePrice + '</p>' +
                                        '<p><span>服务税率</span> : ' + serviceRate + '</p>' +
                                        '<p><span>计量单位</span> : ' + serviceUnit + '</p>' +
                                        '<p><span>服务说明</span> : ' + serviceDescription + '</p>' +
                                        '</li>'
                                }
                            }
                            $('.j-module-data').html(dataHtml)
                        } else {
                            // 正常响应, 但服务器返回错误时, 额外操作处理
                            $('.j-module-data').html(messageHtml)
                        }
                        // 自定义弹窗 id>search 高度大于310px 加上垂直滚动条
                        var search = document.getElementById("search")
                        if (search.offsetHeight > '310') {
                            $('#search').css('height', '310px')
                            $('#search').css('overflow-y', 'scroll')
                        }
                    },
                    error: function (xhr, ajaxOptions, thrownError) {
                        showMessage('抱歉, 请求服务器失败[ref:' + xhr.statusText + ']')
                    }
                })
            }

            // 打开后自动触发搜索全部
            callModules(dataType, $('#txtKeyword').val())
        })
    }

    $('.j-data-module').click(function () {
        // 请求api
        openModulePopup($(this))
    })

    // 请求保存接口
    function callSaveRecord() {
        // TODO 待处理 检查表单数据
        // var name = $('#name').val()
        // if (Utils.isEmpty(name)) {
        //     console.log('isEmpty')
        //     showMessage('推送方案必须填写基站名称[ref:name]')
        //     $('#name').focus()
        //     return
        // }

        // 判断目前方案状态, 决定是否能够修改方案
        if (!recordObj) {
            showMessage('该方案设计不存在, 请联系管理员')
            return
        }
        if (globalRole == 0) {
            showMessage('选址人员不可修改方案设计')
            return
        }
        if (globalRole == 1) {
            showMessage('选型人员不可修改方案设计')
            return
        }

        var formData = recordObj
        var actualCost = $(".actual").text()
        formData.isDesign = true
        formData.status = globalRole

        $.ajax({
            url: globalApiUrl + '/api/form/save.html',
            contentType: 'application/x-www-form-urlencoded',
            type: 'post',
            data: {
                data: JSON.stringify(formData),
                actualCost:actualCost
            },
            dataType: 'json',
            beforeSend: function () {
                setLoading('正在保存中, 请稍候...')
                $("#btnSubmit").attr('disabled', 'disabled')
            },
            complete: function () {
                hideLoading()
                $('#btnSubmit').removeAttr('disabled')
            },
            success: function (response) {
                // TODO 待处理
                // showMessage(response.message)

                // 响应成功
                if (response.state === 1) {
                    globalRecordId = response.data._id
                    window.location.replace('/home/pdesign.html?recordId=' + globalRecordId + '&actualCost=' + actualCost)
                    showMessage('设计成功!')
                } else {
                    console.log(response.state)
                    // TODO 正常响应, 但服务器返回错误时, 额外操作处理
                }
            },
            error: function (xhr, ajaxOptions, thrownError) {
                showMessage('抱歉, 请求服务器失败[ref:' + xhr.statusText + ']')
            }
        })
    }

    $('#btnSubmit').click(function () {
        // 请求api
        callSaveRecord()
    })

    // 实现重置按钮
    function resetUI() {
        // TODO 待处理 重置数据
        // $('#name').val('')
        $('body').animate({scrollTop: 0}, 500, function () {
        })
    }

    $('#btnReset').click(function () {
        resetUI()
    })
});