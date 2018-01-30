/*!

 @Name：ETeam infinite js v0.1
 $Author：carson
 $Site：http://www.eteam.top
 @Date：2016-01-16
 @License：MIT
 $('.aa').infinite({url:'', params:'a=b&c=d'})
 */
;(function($) {
	"use strict";
	var target = undefined
	var currentSize = undefined
	var totalPage = undefined
	var locked = false
	var opts = {
		"url": '',
		"pager": '0',
		"size": '10',
		"params": '',
		"template": '',
		"type": 'post',
		"format": 'json',
		"offset": '100'
	}

	var methods = {
		// 初始化
		init: function(options) {
			target = $(this)
			currentSize = 0
			totalPage = 0
			if (options) {
				$.extend(opts, options);
			}

			var method = {};
			//获取当前页码
			return method.getPager = function() {
					return opts.pager;
				},
				//刷新当前页
				method.reload = function() {
					methods.getData();
				},
				//重新加载
				method.onload = function(options) {
					if (options) {
						opts.params = options;
					}
					opts.pager = 0;
					methods.getData();
				},
				//获取列表数
				method.getCurrentSize = function() {
					return currentSize;
				},
				//获取总页数
				method.getTotalPage = function() {
					return totalPage;
				},
				method
		},

		// 请求参数
		getParam: function() {
			// 追加请求参数
			//var param = "page=" + opts.pager + "&limit=" + opts.size;
			//param = param + "&" + opts.params;
			//console.log(param);
			//return param;
			return opts.params;
		},

		// 请求数据
		getData: function() {
			locked = false;
			var url = opts.url
			var keyword = opts.keyword
			var formData = {
				city: globalCity
			}

			if(keyword) {
				formData.keywords = []
				formData.keywords.push(keyword)
			}

			$.ajax({
			   url: url,
			   contentType: 'application/x-www-form-urlencoded',
			   type: opts.type,
			   data: {
				   data: JSON.stringify(formData),
				   sort: '{"time": -1}',
				   page: opts.pager,
				   limit: opts.size
			   },
			   dataType: opts.format,
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
					   totalPage = response.total
					   response.role = globalRole
					   var html = template(opts.template, response);
					   if (opts.pager > 0) {
						   target.append(html);
					   } else {
						   target.html(html);
					   }

					   if(opts.pager == 0) {
						   currentSize = response.data.length
						   target.animate({
							   scrollTop: 0
						   }, 0);
						   // 检查第一页是否有数据
						   if(response.data.total == 0) {
							   return;
						   } else {
							   locked = true;
						   }
					   } else {
						   currentSize = currentSize + response.data.length
						   locked = true;
					   }
					   opts.pager++;
					   console.log('第' + opts.pager + '页, 当前条数: ' + currentSize)
				   } else {
					   // TODO 正常响应, 但服务器返回错误时, 额外操作处理
					   // 响应错误一次,将不能继续滚动获取更多数据
					   showMessage(response.message);
				   }
			   },
			   error: function (xhr, ajaxOptions, thrownError) {
				   showMessage('抱歉, 请求服务器失败[ref:' + xhr.statusText + ']')
			   }
		   })
		}
	}

	// 监听滚动
	$(document).scroll(function () {
		var scrollTop = $(window).scrollTop() + parseInt(opts.offset);
		var documentHeight = $(document).height() - $(window).height();
		// console.log('scrollTop>>' + scrollTop)
		// console.log('documentHeight>>' + documentHeight)
		// console.log('locked>>' + locked)
		// console.log('totalPage>>' + totalPage)
		// console.log('currentSize>>' + currentSize)
		if (methods && scrollTop >= documentHeight && locked && (currentSize < totalPage)) {
			console.log('监听滚动后再次获取数据')
			// console.log('1totalPage>>' + totalPage)
			// console.log('2currentSize>>' + currentSize)
			methods.getData();
		}
	});

	$.fn.infinite = function(method) {
		if (methods[method]) {
			return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
		} else if (typeof method == 'object' || !method) {
			return methods.init.apply(this, arguments);
		} else {
			$.error('Method ' + method + ' does not exist!');
		}
	}
})(jQuery)