/**
 * Created by karl on 2017/5/1.
 */
jQuery(document).ready(function ($) {
    // 响应实体
    var responseData = {}

    // 级联对象
    var cityObj = {}
    var countyObj = {}
    var applySceneObj = {}
    var constructionTypeObj = {}
    var isBeautifyObj = {}
    var antennaHeightObj = {}
    var buildInformationObj = {}
    var needMachineObj = {}
    var towerObj = {}
    var roomObj = {}
    var suitObj = {}

    // 级联列表
    var citiesArray = []
    var countiesArray = []
    var applyScenesArray = []
    var typeArray = []
    var beautifiesArray = []
    var antennaHeightsArray = []
    var buildInformationsArray = []
    var buildInformationForRecordsArray = []
    var machinesArray = []
    var machineForRecordsArray = []
    var towersArray = []
    var towerForRecordsArray = []
    var roomsArray = []
    var roomForRecordsArray = []
    var suitsArray = []
    var suitForRecordsArray = []

    // 选型id列表（包括: 推荐 和 最优）
    var selectionIdArray = []

    // 选择器
    var pickerItems = ['city', 'area', 'scenario', 'type', 'beautify', 'hang', 'build','machine', 'tower', 'room', 'suit']
    var pickerIndexs = {
        'city': -1,
        'area': -1,
        'scenario': -1,
        'type': -1,
        'beautify': -1,
        'hang': -1,
        'build': -1,
        'machine': -1,
        'tower': -1,
        'room': -1,
        'suit': -1
    }
    var pickerIndexsLast = {}

    // 当前已选选型索引
    var currentOptionIndex = 0
    var recordObj = undefined




    $(function () {
        // 是否为存在记录, 支持重选修改表单
        if (recordStr) {
            recordObj = JSON.parse(recordStr)
            // 更改网页标题, 兼容微信分享有标识
            var title = recordObj.stationName + ' - 智选优设'
            $("title").html(title)
            document.title = title

            currentOptionIndex = $("input[name=recommended]:checked").attr("data-index")
            $("input[name=recommended]").click(function () {
                currentOptionIndex = $("input[name=recommended]:checked").attr("data-index")
                resetFormForData()
            })
        }

        // 请求方案数据接口
        callSelections()

        // 基站名称为空时提示
        $('#name').keyup(function () {
            if ($(this).val() == '') {
                $("#msg_name").text('请输入基站名称')
                return;
            }
            $("#msg_name").text('')
        })

        // 详细地址为空时提示
        $('#address').keyup(function () {
            if ($(this).val() == '') {
                $("#msg_address").text('请输入详细地址')
                return;
            }
            $("#msg_address").text('')
        })
    })

    // 请求方案数据接口
    function callSelections() {
        var formData = {
            city: globalCity
        }
        $.ajax({
            url: globalApiUrl + '/api/form/load.html',
            contentType: 'application/x-www-form-urlencoded',
            type: 'post',
            data: {
                data: JSON.stringify(formData)
            },
            dataType: 'json',
            beforeSend: function () {
                // 请求前
                setLoading('')
            },
            complete: function () {
                // 请求后
                hideLoading()
            },
            success: function (response) {
                // 响应成功
                showMessage(response.message)
                if (response.state == 1) {
                    responseData = response
                    cityItem()
                    resetFormForData()
                } else {
                    // TODO 正常响应, 但服务器返回错误时, 额外操作处理
                }
            },
            error: function (xhr, ajaxOptions, thrownError) {
                showMessage('抱歉, 请求服务器失败[ref:' + xhr.statusText + ']')
            }
        })
    }

    // 根据选中值, 重置选型表单
    function resetFormForData() {
        if (recordObj) {
            // 站名
            $('#nameId').addClass('ontop')
            $('#name').val(recordObj.stationName)
            // 城市
            var index = 0
            citiesArray.forEach(function (city, i) {
                if (city.city == recordObj.city) {
                    index = i
                }
            })
            pickerIndexs.city = index
            handleDataForPicker($('#cityItems'))
            // 区县
            var index = 0
            countiesArray.forEach(function (county, i) {
                if (county.county == recordObj.county) {
                    index = i
                }
            })
            pickerIndexs.area = index
            handleDataForPicker($('#areaItems'))
            // 地址
            $('#addressId').removeClass('disabled')
            $('#addressId').addClass('ontop')
            $('#address').removeAttr('disabled')
            $('#address').val(recordObj.address)
            // 根据已选中的, 读取子节点数据
            var option = recordObj.optionList[currentOptionIndex]
            if (option) {
                // 应用场景
                var index = 0
                applyScenesArray.forEach(function (applyScene, i) {
                    if (applyScene.applyScene == option.applyScene) {
                        index = i
                    }
                })
                pickerIndexs.scenario = index
                handleDataForPicker($('#scenarioItems'))
                // 建设类型
                typeArray.forEach(function (type, i) {
                    if (type.constructionType == option.constructionType) {
                        index = i
                    }
                })
                pickerIndexs.type = index
                handleDataForPicker($('#typeItems'))
                // 是否美化
                beautifiesArray.forEach(function (beautify, i) {
                    if (beautify.isBeautify == option.isBeautify) {
                        index = i
                    }
                })
                pickerIndexs.beautify = index
                handleDataForPicker($('#beautifyItems'))
                // 天线挂高
                antennaHeightsArray.forEach(function (antennaHeight, i) {
                    if (antennaHeight.antennaHeight == option.antennaHeight) {
                        index = i
                    }
                })
                pickerIndexs.hang = index
                handleDataForPicker($('#hangItems'))
                // 共建信息
                buildInformationsArray.forEach(function (buildInformation, i) {
                    if (buildInformation.buildInformation == option.buildInformation) {
                        index = i
                    }
                })
                pickerIndexs.build = index
                handleDataForPicker($('#buildItems'))
                // 是否需大型机械进场
                machinesArray.forEach(function (machine, i) {
                    if (machine.needMachine == option.needMachine) {
                        index = i
                    }
                })
                pickerIndexs.machine = index
                handleDataForPicker($('#machineItems'))
                // 铁塔
                towersArray.forEach(function (tower, i) {
                    if (tower.tower == option.tower) {
                        index = i
                    }
                })
                pickerIndexs.tower = index
                handleDataForPicker($('#towerItems'))
                // 机房
                roomsArray.forEach(function (room, i) {
                    if (room.room == option.room) {
                        index = i
                    }
                })
                pickerIndexs.room = index
                handleDataForPicker($('#roomItems'))
                // 配套
                suitsArray.forEach(function (suit, i) {
                    if (suit.suit == option.suit) {
                        index = i
                    }
                })
                pickerIndexs.suit = index
                handleDataForPicker($('#suitItems'))
            }
        }
    }

    // 初始化城市选项
    function cityItem() {
        var cityHtml = ''
        citiesArray = responseData.data.cities
        if (citiesArray.length > 0) {
            for (var i = 0; i < citiesArray.length; i++) {
                var cities = citiesArray[i]
                cityHtml += '<li data-index="' + i + '" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0); -webkit-user-select: none;">' + cities.city + '</li>'
            }
            $('#cityId').find('.box').removeClass('disabled')
            $('#cityItems').html(cityHtml)

            // 城市选项设置点击事件
            $('#cityId .list-wrap ul li').click(function () {
                var height = $(this).height()
                pickerIndexs.city = parseInt($(this).attr('data-index'))
                clearTimer()
                handleDataForPicker($(this))
                $('.list-wrap').animate({scrollTop: height * pickerIndexs.city}, 500, function () {
                    // 动画回调函数
                    setPickerStatus()
                })
                return false
            })
        } else {
            showMessage('抱歉, 城市信息不全[ref:city]')
        }
    }

    // 响应城市选项
    var timer = null
    var timer_available = false
    $('.list-wrap').scroll(function () {
        // 计时器回调函数
        if ($(this).parents('.picker').find('.container, .popup').hasClass('show')) {
            var li_height = $(this).find('ul li').height()
            var data_type = $(this).parents('.picker').attr('data-type')
            pickerIndexs[data_type] = Math.round(parseInt($(this).scrollTop()) / li_height)
            if (!timer_available) return
            timer = setTimeout(function (target) {
                if (!timer_available) return
                // 计时器回调函数
                if (target.parents('.picker').find('.container, .popup').hasClass('show')) {
                    setPickerStatus()
                    handleDataForPicker(target)
                }
            }, 800, $(this))
        }
    })
    $('.overlay').click(function () {
        if ($(this).parents('.picker').find('.container, .popup').hasClass('show')) {
            // 防止初始化-1导致下标有误
            var data_type = $(this).parents('.picker').attr('data-type')
            if (pickerIndexs[data_type] == -1) {
                pickerIndexs[data_type] = 0
            }
            clearTimer()
            handleDataForPicker($(this))
        }
    })
    function clearTimer() {
        if (timer) {
            clearTimeout(timer)
        }
        timer_available = false
    }

    // 更新界面数据
    function handleDataForPicker(target) {
        var data_type = target.parents('.picker').attr('data-type')
        if (data_type == 'city') {
            cityObj = citiesArray[pickerIndexs.city]
            countiesArray = cityObj.counties
            // 初始化区域选项
            if (countiesArray.length > 0) {
                // 防止重复点击
                if (isObjectValueEqual(pickerIndexs, pickerIndexsLast)) return
                pickerIndexsLast = cloneAll(pickerIndexs)

                target.parents('.picker').find('.js-picker-text').html(cityObj.city)
                target.parents('.picker').find('.js-picker-value').val(cityObj.city)
                var data_next = target.parents('.picker').attr('data-next')
                // 重置下一个的数据
                $('#addressId').addClass('disabled')
                $('#address').attr('disabled', 'disabled')
                resetDataForPicker(data_next)

                var areaHtml = ''
                for (var i = 0; i < countiesArray.length; i++) {
                    var area = countiesArray[i]
                    areaHtml += '<li data-index="' + i + '" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0); -webkit-user-select: none;">' + area.county + '</li>'
                }
                $('#' + data_next + 'Id').find('.box').removeClass('disabled')
                $('#' + data_next + 'Items').html(areaHtml)
                // 放在HTML元素生成之后设置点击事件
                $('#' + data_next + 'Id .list-wrap ul li').click(function () {
                    var height = $(this).height()
                    pickerIndexs.area = parseInt($(this).attr('data-index'))
                    clearTimer()
                    handleDataForPicker($(this))
                    $('.list-wrap').animate({scrollTop: height * pickerIndexs.area}, 500, function () {
                        // 动画回调函数
                        setPickerStatus()
                    })
                    return false
                })
            } else {
                var data_next = target.parents('.picker').attr('data-next')
                // 重置下一个的数据
                resetDataForPicker(data_next)
                showMessage('抱歉, 区域信息不全[ref:' + data_next + ']')
            }
        } else if (data_type == 'area') {
            countyObj = countiesArray[pickerIndexs.area]
            $('#addressId').removeClass('disabled')
            $('#address').removeAttr('disabled')

            // 初始化应用场景选项
            applyScenesArray = countyObj.applyScenes
            if (applyScenesArray.length > 0) {
                // 防止重复点击
                if (isObjectValueEqual(pickerIndexs, pickerIndexsLast)) return
                pickerIndexsLast = cloneAll(pickerIndexs)

                target.parents('.picker').find('.js-picker-text').html(countyObj.county)
                target.parents('.picker').find('.js-picker-value').val(countyObj.county)
                var data_next = target.parents('.picker').attr('data-next')
                // 重置下一个的数据
                resetDataForPicker(data_next)

                var scenarioHtml = ''
                for (var i = 0; i < applyScenesArray.length; i++) {
                    var scenario = applyScenesArray[i]
                    scenarioHtml += '<li data-index="' + i + '" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0); -webkit-user-select: none;">' + scenario.applyScene + '</li>'
                }
                $('#' + data_next + 'Id').find('.box').removeClass('disabled')
                $('#' + data_next + 'Items').html(scenarioHtml)
                // 放在HTML元素生成之后设置点击事件
                $('#' + data_next + 'Id .list-wrap ul li').click(function () {
                    var height = $(this).height()
                    pickerIndexs.scenario = parseInt($(this).attr('data-index'))
                    clearTimer()
                    handleDataForPicker($(this))
                    $('.list-wrap').animate({scrollTop: height * pickerIndexs.scenario}, 500, function () {
                        // 动画回调函数
                        setPickerStatus()
                    })
                    return false
                })
            } else {
                var data_next = target.parents('.picker').attr('data-next')
                // 重置下一个的数据
                resetDataForPicker(data_next)
                showMessage('抱歉, 方案数据不全[ref:' + data_next + ']')
            }
        } else if (data_type == 'scenario') {
            applySceneObj = applyScenesArray[pickerIndexs.scenario]
            typeArray = applySceneObj.constructionTypes

            // 初始化建设类型
            if (typeArray.length > 0) {
                // 防止重复点击
                if (isObjectValueEqual(pickerIndexs, pickerIndexsLast)) return
                pickerIndexsLast = cloneAll(pickerIndexs)

                target.parents('.picker').find('.js-picker-text').html(applySceneObj.applyScene)
                target.parents('.picker').find('.js-picker-value').val(applySceneObj.applyScene)
                var data_next = target.parents('.picker').attr('data-next')
                // 重置下一个的数据
                resetDataForPicker(data_next)

                var typeHtml = ''
                for (var i = 0; i < typeArray.length; i++) {
                    var type = typeArray[i]
                    typeHtml += '<li data-index="' + i + '" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0); -webkit-user-select: none;">' + type.constructionType + '</li>'
                }
                $('#' + data_next + 'Id').find('.box').removeClass('disabled')
                $('#' + data_next + 'Items').html(typeHtml)
                // 放在HTML元素生成之后设置点击事件
                $('#' + data_next + 'Id .list-wrap ul li').click(function () {
                    var height = $(this).height()
                    pickerIndexs.type = parseInt($(this).attr('data-index'))
                    clearTimer()
                    handleDataForPicker($(this))
                    $('.list-wrap').animate({scrollTop: height * pickerIndexs.type}, 500, function () {
                        // 动画回调函数
                        setPickerStatus()
                    })
                    return false
                })
            } else {
                var data_next = target.parents('.picker').attr('data-next')
                // 重置下一个的数据
                resetDataForPicker(data_next)
                showMessage('抱歉, 方案数据不全[ref:' + data_next + ']')
            }
        } else if (data_type == 'type') {
            constructionTypeObj = typeArray[pickerIndexs.type]
            beautifiesArray = constructionTypeObj.isBeautifies

            // 初始化是否美化
            if (beautifiesArray.length > 0) {
                // 防止重复点击
                if (isObjectValueEqual(pickerIndexs, pickerIndexsLast)) return
                pickerIndexsLast = cloneAll(pickerIndexs)

                target.parents('.picker').find('.js-picker-text').html(constructionTypeObj.constructionType)
                target.parents('.picker').find('.js-picker-value').val(constructionTypeObj.constructionType)
                var data_next = target.parents('.picker').attr('data-next')
                // 重置下一个的数据
                resetDataForPicker(data_next)

                var beautifyHtml = ''
                for (var i = 0; i < beautifiesArray.length; i++) {
                    var beautify = beautifiesArray[i]
                    beautifyHtml += '<li data-index="' + i + '" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0); -webkit-user-select: none;">' + beautify.isBeautify + '</li>'
                }
                $('#' + data_next + 'Id').find('.box').removeClass('disabled')
                $('#' + data_next + 'Items').html(beautifyHtml)
                // 放在HTML元素生成之后设置点击事件
                $('#' + data_next + 'Id .list-wrap ul li').click(function () {
                    var height = $(this).height()
                    pickerIndexs.beautify = parseInt($(this).attr('data-index'))
                    clearTimer()
                    handleDataForPicker($(this))
                    $('.list-wrap').animate({scrollTop: height * pickerIndexs.beautify}, 500, function () {
                        // 动画回调函数
                        setPickerStatus()
                    })
                    return false
                })
            } else {
                var data_next = target.parents('.picker').attr('data-next')
                // 重置下一个的数据
                resetDataForPicker(data_next)
                showMessage('抱歉, 方案数据不全[ref:' + data_next + ']')
            }
        } else if (data_type == 'beautify') {
            isBeautifyObj = beautifiesArray[pickerIndexs.beautify]
            antennaHeightsArray = isBeautifyObj.antennaHeights

            // 初始化天线挂高
            if (antennaHeightsArray.length > 0) {
                // 防止重复点击
                if (isObjectValueEqual(pickerIndexs, pickerIndexsLast)) return
                pickerIndexsLast = cloneAll(pickerIndexs)

                target.parents('.picker').find('.js-picker-text').html(isBeautifyObj.isBeautify)
                target.parents('.picker').find('.js-picker-value').val(isBeautifyObj.isBeautify)
                var data_next = target.parents('.picker').attr('data-next')
                // 重置下一个的数据
                resetDataForPicker(data_next)

                var hangHtml = ''
                for (var i = 0; i < antennaHeightsArray.length; i++) {
                    var hang = antennaHeightsArray[i]
                    hangHtml += '<li data-index="' + i + '" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0); -webkit-user-select: none;">' + hang.antennaHeight + '</li>'
                }
                $('#' + data_next + 'Id').find('.box').removeClass('disabled')
                $('#' + data_next + 'Items').html(hangHtml)
                // 放在HTML元素生成之后设置点击事件
                $('#' + data_next + 'Id .list-wrap ul li').click(function () {
                    var height = $(this).height()
                    pickerIndexs.hang = parseInt($(this).attr('data-index'))
                    clearTimer()
                    handleDataForPicker($(this))
                    $('.list-wrap').animate({scrollTop: height * pickerIndexs.hang}, 500, function () {
                        // 动画回调函数
                        setPickerStatus()
                    })
                    return false
                })
            } else {
                var data_next = target.parents('.picker').attr('data-next')
                // 重置下一个的数据
                resetDataForPicker(data_next)
                showMessage('抱歉, 方案数据不全[ref:' + data_next + ']')
            }
        } else if (data_type == 'hang') {
            antennaHeightObj = antennaHeightsArray[pickerIndexs.hang]
            buildInformationsArray = antennaHeightObj.buildInformations

            // 初始化共建信息
            if (buildInformationsArray.length > 0) {
                // 防止重复点击
                if (isObjectValueEqual(pickerIndexs, pickerIndexsLast)) return
                pickerIndexsLast = cloneAll(pickerIndexs)

                target.parents('.picker').find('.js-picker-text').html(antennaHeightObj.antennaHeight)
                target.parents('.picker').find('.js-picker-value').val(antennaHeightObj.antennaHeight)
                var data_next = target.parents('.picker').attr('data-next')
                // 重置下一个的数据
                resetDataForPicker(data_next)

                var buildHtml = ''
                for (var i = 0; i < buildInformationsArray.length; i++) {
                    var build = buildInformationsArray[i]
                    buildHtml += '<li data-index="' + i + '" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0); -webkit-user-select: none;">' + build.buildInformation + '</li>'
                }
                $('#' + data_next + 'Id').find('.box').removeClass('disabled')
                $('#' + data_next + 'Items').html(buildHtml)
                // 放在HTML元素生成之后设置点击事件
                $('#' + data_next + 'Id .list-wrap ul li').click(function () {
                    var height = $(this).height()
                    pickerIndexs.build = parseInt($(this).attr('data-index'))
                    clearTimer()
                    handleDataForPicker($(this))
                    $('.list-wrap').animate({scrollTop: height * pickerIndexs.build}, 100, function () {
                        // 动画回调函数
                        setPickerStatus()
                    })
                    return false
                })
            } else {
                var data_next = target.parents('.picker').attr('data-next')
                // 重置下一个的数据
                resetDataForPicker(data_next)
                showMessage('抱歉, 方案数据不全[ref:' + data_next + ']')
            }
        } else if (data_type == 'build') {
            buildInformationObj = buildInformationsArray[pickerIndexs.build]
            machinesArray = buildInformationObj.needMachines
            buildInformationForRecordsArray = buildInformationObj.buildInformationForRecords

            //初始化是否需大型机械进场
            if (machinesArray.length > 0) {
                // 防止重复点击
                if (isObjectValueEqual(pickerIndexs, pickerIndexsLast)) return
                pickerIndexsLast = cloneAll(pickerIndexs)

                target.parents('.picker').find('.js-picker-text').html(buildInformationObj.buildInformation)
                target.parents('.picker').find('.js-picker-value').val(buildInformationObj.buildInformation)
                var data_next = target.parents('.picker').attr('data-next')
                // 重置下一个的数据
                resetDataForPicker(data_next)

                var machineHtml = ''
                for (var i = 0; i < machinesArray.length; i++) {
                    var machine = machinesArray[i]
                    machineHtml += '<li data-index="' + i + '" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0); -webkit-user-select: none;">' + machine.needMachine + '</li>'
                }
                $('#' + data_next + 'Id').find('.box').removeClass('disabled')
                $('#' + data_next + 'Items').html(machineHtml)
                // 放在HTML元素生成之后设置点击事件
                $('#' + data_next + 'Id .list-wrap ul li').click(function () {
                    var height = $(this).height()
                    pickerIndexs.machine = parseInt($(this).attr('data-index'))
                    clearTimer()
                    handleDataForPicker($(this))
                    $('.list-wrap').animate({scrollTop: height * pickerIndexs.machine}, 500, function () {
                        // 动画回调函数
                        setPickerStatus()
                    })
                    return false
                })
            } else {
                var data_next = target.parents('.picker').attr('data-next')
                // 重置下一个的数据
                resetDataForPicker(data_next)
                showMessage('抱歉, 方案数据不全[ref:' + data_next + ']')
            }
        } else if (data_type == 'machine') {
            needMachineObj = machinesArray[pickerIndexs.machine]
            towersArray = needMachineObj.towers
            machineForRecordsArray = needMachineObj.machineForRecords


            // 只有精准选型 才会有下一级可选
            if (globalRole >= 1) {// 方案选型
                // 初始化铁塔信息
                if (towersArray.length > 0) {
                    // 防止重复点击
                    if (isObjectValueEqual(pickerIndexs, pickerIndexsLast)) return
                    pickerIndexsLast = cloneAll(pickerIndexs)

                    target.parents('.picker').find('.js-picker-text').html(needMachineObj.needMachine)
                    target.parents('.picker').find('.js-picker-value').val(needMachineObj.needMachine)
                    console.log("needMachineObj.needMachine>>>>>>",needMachineObj.needMachine)
                    var data_next = target.parents('.picker').attr('data-next')
                    // 重置下一个的数据
                    resetDataForPicker(data_next)

                    var towerHtml = ''
                    for (var i = 0; i < towersArray.length; i++) {
                        var tower = towersArray[i]
                        towerHtml += '<li data-index="' + i + '" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0); -webkit-user-select: none;">' + tower.tower + '</li>'
                    }
                    $('#' + data_next + 'Id').find('.box').removeClass('disabled')
                    $('#' + data_next + 'Items').html(towerHtml)
                    // 放在HTML元素生成之后设置点击事件
                    $('#' + data_next + 'Id .list-wrap ul li').click(function () {
                        var height = $(this).height()
                        pickerIndexs.tower = parseInt($(this).attr('data-index'))
                        clearTimer()
                        handleDataForPicker($(this))
                        $('.list-wrap').animate({scrollTop: height * pickerIndexs.tower}, 500, function () {
                            // 动画回调函数
                            setPickerStatus()
                        })
                        return false
                    })

                    // // 初始化推荐方案id列表
                    // selectionIdArray = []
                    // for (var i = 0; i < buildInformationForRecordsArray.length; i++) {
                    //     selectionIdArray.push(buildInformationForRecordsArray[i]._id)
                    // }
                    // callRecommends()
                } else {
                    var data_next = target.parents('.picker').attr('data-next')
                    // 重置下一个的数据
                    resetDataForPicker(data_next)
                    showMessage('抱歉, 方案数据不全[ref:' + data_next + ']')
                }
            } else {
                // 防止重复点击
                if (isObjectValueEqual(pickerIndexs, pickerIndexsLast)) return
                pickerIndexsLast = cloneAll(pickerIndexs)

                target.parents('.picker').find('.js-picker-text').html(needMachineObj.needMachine)
                target.parents('.picker').find('.js-picker-value').val(needMachineObj.needMachine)

                // 初始化推荐方案id列表
                selectionIdArray = []
                for (var i = 0; i < buildInformationForRecordsArray.length; i++) {
                    selectionIdArray.push(buildInformationForRecordsArray[i]._id)
                }
                callRecommends()
            }
        } else if (data_type == 'tower') {
            towerObj = towersArray[pickerIndexs.tower]
            roomsArray = towerObj.rooms
            towerForRecordsArray = towerObj.towerForRecords

            // 初始化机房信息
            if (roomsArray.length > 0) {
                // 防止重复点击
                if (isObjectValueEqual(pickerIndexs, pickerIndexsLast)) return
                pickerIndexsLast = cloneAll(pickerIndexs)

                target.parents('.picker').find('.js-picker-text').html(towerObj.tower)
                target.parents('.picker').find('.js-picker-value').val(towerObj.tower)
                var data_next = target.parents('.picker').attr('data-next')
                // 重置下一个的数据
                resetDataForPicker(data_next)

                var roomHtml = ''
                for (var i = 0; i < roomsArray.length; i++) {
                    var room = roomsArray[i]
                    roomHtml += '<li data-index="' + i + '" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0); -webkit-user-select: none;">' + room.room + '</li>'
                }
                $('#' + data_next + 'Id').find('.box').removeClass('disabled')
                $('#' + data_next + 'Items').html(roomHtml)
                // 放在HTML元素生成之后设置点击事件
                $('#' + data_next + 'Id .list-wrap ul li').click(function () {
                    var height = $(this).height()
                    pickerIndexs.room = parseInt($(this).attr('data-index'))
                    clearTimer()
                    handleDataForPicker($(this))
                    $('.list-wrap').animate({scrollTop: height * pickerIndexs.room}, 500, function () {
                        // 动画回调函数
                        setPickerStatus()
                    })
                    return false
                })

                // // 初始化推荐方案id列表
                // selectionIdArray = []
                // for (var i = 0; i < towerForRecordsArray.length; i++) {
                //     selectionIdArray.push(towerForRecordsArray[i]._id)
                // }
                // callRecommends()
            } else {
                var data_next = target.parents('.picker').attr('data-next')
                // 重置下一个的数据
                resetDataForPicker(data_next)
                showMessage('抱歉, 方案数据不全[ref:' + data_next + ']')
            }
        } else if (data_type == 'room') {
            roomObj = roomsArray[pickerIndexs.room]
            suitsArray = roomObj.suits
            roomForRecordsArray = roomObj.roomForRecords

            // 初始化配套信息
            if (suitsArray.length > 0) {
                // 防止重复点击
                if (isObjectValueEqual(pickerIndexs, pickerIndexsLast)) return
                pickerIndexsLast = cloneAll(pickerIndexs)

                target.parents('.picker').find('.js-picker-text').html(roomObj.room)
                target.parents('.picker').find('.js-picker-value').val(roomObj.room)
                var data_next = target.parents('.picker').attr('data-next')
                // 重置下一个的数据
                resetDataForPicker(data_next)

                var suitHtml = ''
                for (var i = 0; i < suitsArray.length; i++) {
                    var suit = suitsArray[i]
                    suitHtml += '<li data-index="' + i + '" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0); -webkit-user-select: none;">' + suit.suit + '</li>'
                }
                $('#' + data_next + 'Id').find('.box').removeClass('disabled')
                $('#' + data_next + 'Items').html(suitHtml)
                // 放在HTML元素生成之后设置点击事件
                $('#' + data_next + 'Id .list-wrap ul li').click(function () {
                    var height = $(this).height()
                    pickerIndexs.suit = parseInt($(this).attr('data-index'))
                    clearTimer()
                    handleDataForPicker($(this))
                    $('.list-wrap').animate({scrollTop: height * pickerIndexs.suit}, 500, function () {
                        // 动画回调函数
                        setPickerStatus()
                    })
                    return false
                })

                // // 初始化推荐方案id列表
                // selectionIdArray = []
                // for (var i = 0; i < roomForRecordsArray.length; i++) {
                //     selectionIdArray.push(roomForRecordsArray[i]._id)
                // }
                // callRecommends()
            } else {
                var data_next = target.parents('.picker').attr('data-next')
                // 重置下一个的数据
                resetDataForPicker(data_next)
                showMessage('抱歉, 方案数据不全[ref:' + data_next + ']')
            }
        } else if (data_type == 'suit') {
            suitObj = suitsArray[pickerIndexs.suit]
            suitForRecordsArray = suitObj.suitForRecords

            // 防止重复点击
            if (isObjectValueEqual(pickerIndexs, pickerIndexsLast)) return
            pickerIndexsLast = cloneAll(pickerIndexs)

            target.parents('.picker').find('.js-picker-text').html(suitObj.suit)
            target.parents('.picker').find('.js-picker-value').val(suitObj.suit)

            // 请求最优方案详细信息
            selectionIdArray = []
            for (var i = 0; i < suitForRecordsArray.length; i++) {
                selectionIdArray.push(suitForRecordsArray[i]._id)
            }
            callPlanDetail()
        }
    }

    // 请求方案推荐接口
    function callRecommends() {
        var formData = selectionIdArray
        $.ajax({
            url: globalApiUrl + '/api/form/find.html',
            contentType: 'application/x-www-form-urlencoded',
            type: 'post',
            data: {
                data: JSON.stringify(formData),
                sort: '{"time": -1}',
                page: 0,
                limit: 3
            },
            dataType: 'json',
            beforeSend: function () {
                // 请求前
                setLoading('')
            },
            complete: function () {
                // 请求后
                hideLoading()
                globalInit = false
            },
            success: function (response) {
                // 响应成功
                showMessage(response.message)
                if (response.state == 1) {
                    if (response.data.length > 0) {
                        $('.op-config .assist-div').addClass('show')

                        var recommendHtml = ''
                        // 初始化推荐方案id列表
                        selectionIdArray = []
                        for (var i = 0; i < response.data.length; i++) {
                            var recommend = response.data[i]
                            selectionIdArray.push(recommend._id)
                            var subHtml = ''
                            // 首次进入和修改选型时, 根据已有方案选择此项
                            if (globalInit && recordObj && $('#recommended').attr("data-index") == i) {
                                subHtml = 'checked'
                            }
                            var index = i + 1
                            recommendHtml += '<li>' +
                                '<label> <input type="radio" ' + subHtml + ' class="option-input radio" name="recommend" value="' + recommend._id + '" data-index="' + i + '" /> </label>' +
                                '<span class="label">方案' + index + '</span>' +
                                '<div class="scheme">' +
                                '<p><span>名称</span> : ' + recommend.output + '</p>' +
                                '<p><span>造价综合差异率</span> : ' + recommend.differenceRate + '%</p>' +
                                '<p><span>百元投资租金(元)</span> : <span class="money">&#65509;' + recommend.investmentRent + '</span></p>' +
                                '</div>' +
                                '</li>'
                        }
                        $('#referralItems').html(recommendHtml)
                    } else {
                        showMessage('抱歉, 暂无推荐方案数据')
                    }
                } else {
                    // TODO 正常响应, 但服务器返回错误时, 额外操作处理
                }
            },
            error: function (xhr, ajaxOptions, thrownError) {
                showMessage('抱歉, 请求服务器失败[ref:' + xhr.statusText + ']')
            }
        })
    }

    // 请求方案详细接口
    function callPlanDetail() {
        var formData = {
            _ids: selectionIdArray
        }
        $.ajax({
            url: globalApiUrl + '/api/schema/find.html',
            contentType: 'application/x-www-form-urlencoded',
            type: 'post',
            data: {
                schema: 'option',
                data: JSON.stringify(formData),
                sort: '{"time": -1}',
                page: 0,
                limit: 1
            },
            dataType: 'json',
            beforeSend: function () {
                // 请求前
                setLoading('')
            },
            complete: function () {
                // 请求后
                hideLoading()
            },
            success: function (response) {
                // 响应成功
                showMessage(response.message)
                if (response.state == 1) {
                    if (response.data.length > 0) {
                        $('.op-config .assist-div').addClass('show')

                        var planHtml = ''
                        // 初始化推荐方案id列表
                        selectionIdArray = []
                        for (var i = 0; i < response.data.length; i++) {
                            var plan = response.data[i]
                            selectionIdArray.push(plan._id)
                            $('.op-config .js-price-text').html(plan.differenceRate + ' %')
                            $('.op-config .js-spread-text').html('&#65509; ' + plan.investmentRent)
                            planHtml =
                                '<p><span>铁塔</span> : ' + plan.tower + '</p>' +
                                '<p><span>机房</span> : ' + plan.room + '</p>' +
                                '<p><span>配套</span> : ' + plan.suit + '</p>' +
                                '<p><span>标准建设成本(万)</span> : <span class="money"> &#65509; ' + plan.totalPrice + '</span></p>' +
                                '<p><span>实际建设成本合计(万)</span> : <span class="money"> &#65509; ' + plan.totalCost + '</span></p>' +
                                '<p><span>造价综合差异率*100</span> : ' + plan.differenceRate + ' %</p>' +
                                '<p><span>百元投资租金/年（元）</span> : <span class="money"> &#65509; ' + plan.investmentRent + '</span></p>'
                            $('#planDiv').html(planHtml)
                        }
                    } else {
                        showMessage('抱歉, 暂无最优方案数据')
                    }
                } else {
                    // TODO 正常响应, 但服务器返回错误时, 额外操作处理
                }
            },
            error: function (xhr, ajaxOptions, thrownError) {
                showMessage('抱歉, 请求服务器失败[ref:' + xhr.statusText + ']')
            }
        })
    }

    // 请求保存接口
    function callSaveRecord() {
        // 检查表单数据
        var name = $('#name').val()
        if (Utils.isEmpty(name)) {
            console.log('isEmpty')
            showMessage('推送方案必须填写基站名称[ref:name]')
            $('#name').focus()
            return
        }

        var province = $('input[name=province]').val()
        if (Utils.isEmpty(province)) {
            showMessage('推送方案必须选择所在省份[ref:province]')
            return
        }

        var city = $('input[name=city]').val()
        if (Utils.isEmpty(city)) {
            showMessage('推送方案必须选择所在城市[ref:city]')
            return
        }

        var area = $('input[name=area]').val()
        if (Utils.isEmpty(area)) {
            showMessage('推送方案必须选择所在县/区[ref:county]')
            return
        }

        var address = $('#address').val()
        if (Utils.isEmpty(address)) {
            showMessage('推送方案必须填写详细地址[ref:address]')
            $('#address').focus()
            return
        }

        var scenario = $('input[name=scenario]').val()
        if (Utils.isEmpty(scenario)) {
            showMessage('推送方案必须选择应用场景[ref:applyScene]')
            return
        }

        var type = $('input[name=type]').val()
        if (Utils.isEmpty(type)) {
            showMessage('推送方案必须选择建设类型[ref:constructionType]')
            return
        }

        var beautify = $('input[name=beautify]').val()
        if (Utils.isEmpty(beautify)) {
            showMessage('推送方案必须选择是否美化[ref:machine]')
            return
        }

        var hang = $('input[name=hang]').val()
        if (Utils.isEmpty(hang)) {
            showMessage('推送方案必须选择天线挂高[ref:antennaHeight]')
            return
        }

        var build = $('input[name=build]').val()
        if (Utils.isEmpty(build)) {
            showMessage('推送方案必须选择共建信息[ref:buildInformation]')
            return
        }

        var machine = $('input[name=machine]').val()
        if (Utils.isEmpty(machine)) {
            showMessage('推送方案必须选择是否需大型机械进场信息[ref:buildInformation]')
            return
        }

        // 只有精准选型 才要求必选
        var planIndex = 0
        if (globalRole >= 1) {// 方案选型
            var tower = $('input[name=tower]').val()
            if (Utils.isEmpty(tower)) {
                showMessage('推送方案必须选择铁塔信息[ref:tower]')
                return
            }

            var room = $('input[name=room]').val()
            if (Utils.isEmpty(room)) {
                showMessage('推送方案必须选择机房信息[ref:room]')
                return
            }

            var suit = $('input[name=suit]').val()
            if (Utils.isEmpty(suit)) {
                showMessage('推送方案必须选择配套信息[ref:suit]')
                return
            }
        } else {
            var recommend = $('input[name=recommend]:checked').val()
            if (Utils.isEmpty(recommend)) {
                showMessage('推送方案必须选择推荐方案[ref:recommend]')
                return
            }
            planIndex = parseInt($('input[name=recommend]:checked').attr('data-index'))
        }

        var accountId = globalAccountId

        // 判断目前方案状态, 决定是否能够修改方案
        if (recordObj) {
            // 保存选址人员帐号id
            accountId = recordObj.accountId
            if (globalRole == 0 && recordObj.status > 0) {
                showMessage('该方案正处于选型阶段, 选址人员不可修改')
                return
            }
            if (globalRole == 1 && recordObj.status > 1) {
                showMessage('该方案正处于设计阶段, 选型人员不可修改')
                return
            }
            if (globalRole == 2 && recordObj.status <= 1) {
                showMessage('该方案正处于选型阶段, 设计人员不可修改')
                return
            }
            if (recordObj.status >= 2) {
                showMessage('该方案已经设计完毕, 方案的选型不可修改')
                return
            }
        }

        var formData = {
            accountId: accountId,
            recordId: globalRecordId,
            stationName: name,
            province: province,
            city: city,
            county: area,
            address: address,
            // TODO 待处理 自动定位获取
            longitude: "",
            latitude: "",
            actualCost: 0,
            optionList: [],
            status: globalRole
        }
        // 初始化方案列表实体
        for (var i = 0; i < selectionIdArray.length; i++) {
            var plan = {
                _id: selectionIdArray[i],
                status: 0
            }
            // 根据索引, 标识选中方案的状态
            if (i == planIndex) {
                plan.status = 1
            }
            formData.optionList.push(plan)
        }
        $.ajax({
            url: globalApiUrl + '/api/form/save.html',
            contentType: 'application/x-www-form-urlencoded',
            type: 'post',
            data: {
                data: JSON.stringify(formData)
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
                    console.log('globalRecordId>>' + globalRecordId)
                    resetUI()
                    var url = '/home/pselector.html' // 选址和选型人员, 只能选择模型, 无权限查看设计相关
                    if (globalRole >= 2) {// 设计级别以上的人员才能全盘跑完
                        url = '/home/pselector.html'
                    }
                    window.location.replace(url + '?recordId=' + globalRecordId)
                    showMessage('推送成功！')
                  /* window.location.replace(url + '?recordId=' + globalRecordId)*/
                } else {
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


    // 选择器控制处理
    $('.picker .overlay').click(function () {
        setPickerStatus()
        return false
    })
    $('.popup').click(function () {
        return false
    })
    $('.picker').click(function () {
        if ($(this).find('.disabled').length <= 0) {
            timer_available = true
            setPickerStatus($(this))
        }
    })

    // 重置数据
    function resetDataForPicker(next) {
        // 重置下一个和它以下的所有节点
        for (var i = pickerItems.indexOf(next); i < pickerItems.length; i++) {
            // picker reset
            var picker = pickerItems[i]
            $('#' + picker + 'Id').find('.box').addClass('disabled')
            $('#' + picker + 'Items').html('')
            $('#' + picker + 'Id').find('.js-picker-text').html('请选择')
            $('#' + picker + 'Id').find('.js-picker-value').val('')
            pickerIndexs[picker] = -1
            pickerIndexsLast[picker] = -1

            // 重置推荐方案(隐藏)
            $('.op-config .assist-div').removeClass('show')
        }
    }

    // 实现重置按钮
    function resetUI() {
        $('#name').val('')
        $('#cityId').find('.js-picker-text').html('请选择')
        $('#cityId').find('.js-picker-value').val('')
        pickerIndexs['city'] = -1
        pickerIndexsLast['city'] = -1
        $('#addressId').addClass('disabled')
        $('#address').attr('disabled', 'disabled')
        resetDataForPicker('area')
        $('body').animate({scrollTop: 0}, 500, function () {
        })
    }

    $('#btnReset').click(function () {
        resetUI()
    })

    // 设置选择器的状态
    function setPickerStatus(target) {
        if (target) {
            target.find('.container, .popup').addClass('show')
            // $('body').css('overflow', 'hidden')
            $('body, html').css({
                'height': '100%',
                'overflow': 'hidden'
            })
        } else {
            if ($('.picker').find('.container, .popup').hasClass('show')) {
                $('.picker').find('.container, .popup').removeClass('show')
                // $('body').css('overflow', 'auto')
                $('body, html').css({
                    'overflow': 'auto'
                })
            }
        }
    }

});