function ShareBox (point) {
	var self = this;
	LExtends(self, LSprite, []);

	self.userPoint = point;
	self.screenshotData = null;
	self.screenshotUrl = null;

	self.curtainLayer = null;

	var hintTxt = new LTextField();
	hintTxt.text = "Share On";
	hintTxt.size = 25;
	hintTxt.color = "#FFFFFF";
	hintTxt.stroke = true;
	hintTxt.lineColor = "#000000";
	hintTxt.lineWidth = 2;
	self.addChild(hintTxt);

	var btnLayer = new LSprite();
	btnLayer.y = 40;
	self.addChild(btnLayer);

	var shareQZoneBtn = self.createBtn("icon_qzone", ShareUtils.Api.QZONE);
	btnLayer.addChild(shareQZoneBtn);
	
	var shareWeiboBtn = self.createBtn("icon_weibo", ShareUtils.Api.WEIBO);
	shareWeiboBtn.x = 80;
	btnLayer.addChild(shareWeiboBtn);

	hintTxt.x = (btnLayer.getWidth() - hintTxt.getWidth()) / 2;
}

ShareBox.ShareInfo = {
	URL : "http://wyh.wjjsoft.com/pages/flying_stone/",
	TITLE : "Flying Stone - Kick out birds with stones",
	DEFAULT_PICTURE : "http://wyh.wjjsoft.com/images/game_screenshots/flying_stone_ss.png",
	CONTENT : "I got {point} in 'Flying Stone'. Come on and challenge me!!!"
};

ShareBox.getScreenshot = function () {
	var stage = LGlobal.stage, w = 700, h = (LGlobal.height / LGlobal.width) * w, dataUrl;

	var mask = new LShape();
	mask.graphics.drawRect(0, "", [0, 0, LGlobal.width, LGlobal.height]);

	stage.scaleX = stage.scaleY = w / stage.getWidth();
	stage.mask = mask;

	dataUrl = stage.getDataURL("image/png").replace(/^data:image\/\w+;base64,/, "");

	stage.scaleX = stage.scaleY = 1;
	stage.mask = null;

	return dataUrl;
};

ShareBox.prototype.createCurtain = function (btn) {
	var self = this;

	stageLayer.mouseEnabled = false;

	self.curtainLayer = new LSprite();
	curtainLayer.addChild(self.curtainLayer);

	var bgSh = new LShape();
	bgSh.alpha = 0.7;
	bgSh.graphics.drawRect(0, "", [0, 0, LGlobal.width, LGlobal.height], true, "#000000");
	self.curtainLayer.addChild(bgSh);

	var hintTxt = new LTextField();
	hintTxt.text = "Processing...";
	hintTxt.size = 28;
	hintTxt.weight = "bold";
	hintTxt.color = "#FFFFFF";
	hintTxt.textAlign = "center";
	hintTxt.textBaseline = "middle";
	hintTxt.x = LGlobal.width / 2;
	hintTxt.y = LGlobal.height * 0.45;
	hintTxt.stroke = true;
	hintTxt.lineWidth = 3;
	hintTxt.lineColor = "#000000";
	self.curtainLayer.addChild(hintTxt);

	self.curtainLayer.label = hintTxt;
	/** 0 - processing; 1 - successful; -1 - error occured */
	self.curtainLayer.uploadStatus = 0;

	self.curtainLayer.addEventListener(LMouseEvent.MOUSE_UP, function () {
		if (self.curtainLayer.uploadStatus != 0) {
			if (self.curtainLayer.uploadStatus == 1) {
				self.jumpToSharePage(btn.api);
			}

			stageLayer.mouseEnabled = true;

			self.curtainLayer.remove();
			self.curtainLayer = null;
		}
	})
};

ShareBox.prototype.createBtn = function (img, api) {
	var self = this;

	var btn = new LSprite();
	btn.api = api;

	var btnBmp = new LBitmap(new LBitmapData(dataList[img]));
	btn.addChild(btnBmp);

	btn.addEventListener(LMouseEvent.MOUSE_UP, function (e) {
		self.onShareBtnClicked(e.currentTarget);
	});

	return btn;
};

ShareBox.prototype.onShareBtnClicked = function (btn) {
	var self = this;

	if (!self.screenshotUrl) {
		self.screenshotData = ShareBox.getScreenshot();

		self.createCurtain(btn);

		LAjax.post(
			"http://wyh.wjjsoft.com/cgi-bin/upload_image.cgi",
			{
				index : 1,
				data : self.screenshotData
			},
			function (imgUrl) {
				if (!imgUrl || imgUrl == "ERROR OCCURED") {
					imgUrl = ShareBox.ShareInfo.DEFAULT_PICTURE;
				}

				self.screenshotUrl = imgUrl;
				
				if (self.curtainLayer.label) {
					self.curtainLayer.uploadStatus = 1;

					self.curtainLayer.label.text = "Tap to Go on~";
					self.curtainLayer.label.lineColor = "#41CD52";
				}
			},
			function () {
				if (self.curtainLayer.label) {
					self.curtainLayer.uploadStatus = -1;
					
					self.curtainLayer.label.text = "Error! Tap to Close :(";
					self.curtainLayer.label.lineColor = "#FF7F00";
				}
			}
		);
	} else {
		self.jumpToSharePage(btn.api);
	}
};

ShareBox.prototype.jumpToSharePage = function (api) {
	var self = this;

	ShareUtils.share(api, {
		title : ShareBox.ShareInfo.TITLE,
		url : ShareBox.ShareInfo.URL,
		pic : self.screenshotUrl,
		content : ShareBox.ShareInfo.CONTENT.replace("{point}", self.userPoint)
	});
};