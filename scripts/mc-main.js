// 帳戶相關的變數
//----------------------------------------------------------------------------------------------------------------------
var keyAccountId = "SenaoUserId";
var gAccountId = undefined;
var glon;
var glat;
var mode;
//----------------------------------------------------------------------------------------------------------------------

// 伺服器回傳附近的門市
// JSON 格式，[{編號,距離(公里),名稱}]
// [ {"id":"104","distance":"5.12057","name":"\u5357\u6295\u57d4\u91cc\u670d\u52d9\u4e2d\u5fc3"},
//   {"id":"103","distance":"13.3642","name":"\u5357\u6295\u9b5a\u6c60\u670d\u52d9\u4e2d\u5fc3"},
//   {"id":"101","distance":"13.4719","name":"\u5357\u6295\u9727\u793e\u670d\u52d9\u4e2d\u5fc3"}]
//----------------------------------------------------------------------------------------------------------------------
function findStoreResponse(response)
{
	// 將門市列表加到 store_list 這個 div 裡面
	var items = "";
	$("#CheckIn_store_list").empty();

	// 每一個門市資料 input
	$.each(response, function(i, item)
	{
		// 距離單位為公里，轉換成公尺
		var meters = (item.distance * 1000).toFixed(0);
		//var inputName = "rb_store" + item.SER_ID;
		items = items + '<label for= "' + item.SER_ID + '">' + item.SER_ID + " " + item.SER_NAME + '  (' + meters + ' 公尺)' + '</label>' + '<input type="radio" data-theme="e" id="' + item.SER_ID + '" name="getstore" value="' + item.SER_ID + '">';
	});

	//  加到 div 裡面
	$("#CheckIn_store_list").append(items);
	document.getElementById('checkInSelectedStoreBtn').style.visibility = 'visible';
	// Show

	//  重新顯示
	$("#CheckIn_store_list").trigger('create');
}

// 取得目前位置
//----------------------------------------------------------------------------------------------------------------------
function positioningSuccessCallback(position)
{
	// 緯度
	/*
	var lat = position.coords.latitude;

	// 經度
	var lon = position.coords.longitude;
	*/

	// 經度
	glon = position.coords.longitude

	// 緯度
	glat = position.coords.latitude;

	// 呼叫伺服器的網址
	var url = "http://10.0.129.1/SVCMobile/SVCFindStore.aspx?lon=" + glon.toString() + "&lat=" + glat.toString() + "&distance=2";
	// 用 AJAX 的方式呼叫伺服器尋找附近的門市，完成之後會呼叫 findStoreResponse
	$.getJSON(url, findStoreResponse);
}

// 無法取得目前位置
//----------------------------------------------------------------------------------------------------------------------
function positioningErrorCallback(msg)
{
	$.mobile.changePage('#geolocationErrorDialog', 'pop', true, true);
}

// 使用者在主畫面按下到店打卡
//----------------------------------------------------------------------------------------------------------------------
function CheckInFindStore()
{
	$("#CheckIn_store_list").empty();
	$("#history_list").empty();

	if (navigator.geolocation)
	{
		navigator.geolocation.getCurrentPosition(positioningSuccessCallback, positioningErrorCallback);
	} else
	{
		error('Geolocation not supported');
	}
}

// 伺服器回傳打卡的結果
//----------------------------------------------------------------------------------------------------------------------
function checkinResponse(response)
{
	if (response == "Y")
	{
		alert("打卡成功!");
		$("#CheckIn_store_list").empty();
	} else
	{
		alert("打卡失敗!");
	}

	document.getElementById('checkInSelectedStoreBtn').style.visibility = 'hidden';

	$.mobile.changePage($("#home"),
	{
		transition : "none"
	});
}

// 使用者在門市列表按下到店打卡
//----------------------------------------------------------------------------------------------------------------------
function checkInSelectedStore()
{
	$("input[name]:checked").each(function()
	{
		// 取得門市編號
		var storeId = $(this).val();

		// 呼叫伺服器的網址
		var url = "http://10.0.129.1/SVCMobile/SVCCheckInDataInsertForEmp.aspx?AuthCode=" + gAccountId + "&storeid=" + storeId + "&Lon=" + glon.toString() + "&Lat=" + glat.toString();

		// 用 AJAX 的方式呼叫伺服器尋找附近的門市，完成之後會呼叫 chkeckinResponse
		$.get(url, checkinResponse);
	});
}

function getHistoryResponse(response)
{
	// 將打卡資訊加到 history_list 這個 div 裡面
	//	var items = "<ul data-role='listview' data-inset='true' data-filter='true' data-filter-placeholder='搜尋記錄'>";

	var flag = false;
	var items = "";
	var store = "";
	var checkin_date = "";
	var checkOut_date = "";

	$("#history_list").empty();

	// 依據每家門店顯示打卡時間
	$.each(response, function(i, item)
	{
		flag = true;
		// 顯示打卡時間
		checkin_date = item.CHECK_IN_DATE;
		store = '<h2>' + item.STORE_NO + " " + item.SER_NAME + '</h2>';
		items = items + '<div data-role="collapsible"> ' + store + '<p><small>' + item.CHECK_IN_DATE + '</small></p></div>';
	});

	if (!flag)
	{
		alert("查無相關打卡資訊!!");
		$.mobile.changePage($("#home"),
		{
			transition : "none"
		});
	} else
	{
		//  加到 div 裡面
		$("#history_list").append(items);

		//  重新顯示
		$("#history_list").trigger('create');
	}
}

// 按下打卡記錄
//----------------------------------------------------------------------------------------------------------------------
function getCheckInHistory()
{
	$("#CheckIn_store_list").empty();
	$("#history_list").empty();

	var url = "http://10.0.129.1/SVCMobile/SVCCheckInDataRecHistory.aspx?AuthCode=" + gAccountId;

	// 用 AJAX 的方式呼叫打卡歷史資料，完成之後會呼叫 gethistoryResponse
	$.getJSON(url, getHistoryResponse);
}

// 回傳註冊碼
//----------------------------------------------------------------------------------------------------------------------
function ADloginResponse(response)
{
	// console.log(response);
	if (response == "Y")
	{
		// 帳號
		var loginUserid = $("#accountNameEdit").val();

		// 先判斷帳號是否尚有生效的註冊資訊，若有則無法再註冊
		var url = "http://10.0.129.1/SVCMobile/SVCCheckAuthCode.aspx?mode=2&AuthCode=" + loginUserid;

		// 用 AJAX 的方式呼叫伺服器確認註冊碼，完成之後會呼叫 findAccountIdResponse 傳回認證結果
		$.getJSON(url, findAccountIdResponse);

	} else
	{
		// 認證失敗
		$.mobile.changePage($("#loginFailedPage"),
		{
			transition : "none"
		});
	}
}

// 以AD帳號建立新的註冊碼
//----------------------------------------------------------------------------------------------------------------------
function ADlogin()
{
	var loginUserid = $("#accountNameEdit").val();
	// 帳號
	var loginPassword = encodeURIComponent($("#passwordEdit").val());
	// 密碼

	// 呼叫伺服器的網址進行AD認證
	var url = "http://sim.senao.com.tw/servicewebtest/SVCADAuth.aspx?UserId=" + loginUserid + "&Password=" + loginPassword;

	// 用 AJAX 的方式呼叫伺服器判斷帳號是否為AD，完成之後會呼叫 createAccountResponse
	$.get(url, ADloginResponse);
}

// 以註冊碼判斷是否存在User認證資訊
function findAuthCodeResponse(response)
{
	var items = "";

	if (response.indexOf("fail") >= 0)
	{
		alert("取得註冊資訊失敗!!");
	} else if (response.indexof("Data Not Exists") >= 0)
	{
		alert("此手機註冊資訊已失效!!");
	} else
	{
		// 回傳工號及姓名
		$.each(response, function(i, item)
		{
			items = item.EMP_NO + "-" + item.EMP_NAME;
		});

		alert(items);

		if (items == "")
		{
			$.mobile.changePage($("#createAccountPage"),
			{
				transition : "none"
			});
		} else
		{
			$.mobile.changePage($("#home"),
			{
				transition : "none"
			});
		}
	}
}

// 以帳號判斷是否已有註冊資訊
function findAccountIdResponse(response)
{
	var items = "";

	if (response.indexOf("fail") >= 0)
	{
		alert("取得註冊資訊失敗!!");
	} else
	{
		// 回傳工號及姓名
		$.each(response, function(i, item)
		{
			items = item.EMP_NO;
		});

		if (items != "")
		{
			alert("帳號已有生效的註冊資訊，請先註銷原註冊資訊!!");
			$.mobile.changePage($("#createAccountPage"),
			{
				transition : "none"
			});
		} else
		{
			// 認證成功
			var url = "http://10.0.129.1/SVCMobile/SVCUserAuthCodeInsert.aspx?UserId=" + loginUserid;

			$.get(url, function(response)
			{
				// 在手機寫入註冊碼
				localStorage.setItem(keyAccountId, response);
				$.mobile.urlHistory.clearForward();
				$.mobile.urlHistory.addNew('#home', "none", "Home", "#home", "page");
				$.mobile.changePage($("#loginSuccessPage"),
				{
					transition : "none"
				});
			});

		}
	}
}

// 起始設定
//----------------------------------------------------------------------------------------------------------------------

function documentReady()
{
	$.mobile.page.prototype.options.backBtnText = "返回";
	document.getElementById('checkInSelectedStoreBtn').style.visibility = 'hidden';
	// hide

	//gAccountId = '003622';
	//isAccountIdValid = true;

	// 讀取手機註冊碼
	gAccountId = localStorage.getItem(keyAccountId);
	//gAccountId = '00362220121114022829';
	//isAccountIdValid = true;

	// 判斷有無註冊碼
	var isAccountIdValid = false;
	//gAccountId = 'undefined';
	if (gAccountId != null)
	{
		if (gAccountId != "")
		{
			isAccountIdValid = true;
		}
	}
	if (!isAccountIdValid)
	{
		// 沒有的話，就切換到第一次註冊畫面
		$.mobile.changePage($("#createAccountPage"),
		{
			transition : "none"
		});
	} else
	{
		// 判斷註冊碼是否已註銷，並取得使用者帳號/名稱/生失效/與上一次註冊時間差
		alert("get:" + gAccountId);

		var url = "http://10.0.129.1/SVCMobile/SVCCheckAuthCode.aspx?mode=1&AuthCode=" + gAccountId;

		// 用 AJAX 的方式呼叫伺服器確認註冊碼，完成之後會呼叫 findAuthCodeResponse 傳回員工工號及姓名
		$.getJSON(url, findAuthCodeResponse);

	}
};

$('#CheckInBtn').bind('click', CheckInFindStore);
$('#checkInSelectedStoreBtn').bind('click', checkInSelectedStore);
$('#HistoryBtn').bind('click', getCheckInHistory);
$("#createAccountButton").bind('click', ADlogin);
$(document).ready(documentReady);
