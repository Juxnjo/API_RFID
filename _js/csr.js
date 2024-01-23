//=============================================================================
// ClearStream RFID
//
// Copyright (c) Portable Technology Solutions, LLC.  All rights reserved.
//
// Component: ClearStream API Library
// 
// File:  csr.js
//
// File Comments:  Library for controlling RFID readers, and retrieving tags.
//=============================================================================

var g_aReaderList = null;
var g_bIsLive = false;
var POLL_INTERVAL = 1000;
var url_string = window.location.href;
var url = new URL(url_string);
var sParam_ReaderId = url.searchParams.get("id");

function processReaderBuffer(pReaderBuffer) {

    
    var sReaderDomId = pReaderBuffer.deviceid.replace(/:/g, "");

    var tb1 = document.getElementById(sReaderDomId);
    if (tb1 == null) {

        var pWrapper = $("<div class='bufferwrapper'/>");

        var pReaderInfo = $("<div class='readerstats'/>").attr("id", 'stats' + sReaderDomId);
        pWrapper.append(pReaderInfo);

        tbl = $("<div class='buffertable' />").attr("id", sReaderDomId);

        $("#buffer").append(pWrapper);
        pWrapper.append(tbl);

        pDivRowHeader = $("<div class=\"dataheader\" />").attr("id", sReaderDomId + 'header');

        $('#' + sReaderDomId).append(pDivRowHeader);
        initHeaderRow(pDivRowHeader);

        var pvalidRow = $("#" + sReaderDomId + 'header');

        pvalidRow.data('valid', true);

        // Add the body, to which the rows will be appended.
        pDivTableBody = $("<div class=\"databody\" />").attr("id", sReaderDomId + 'body');
        $('#' + sReaderDomId).append(pDivTableBody);
    }

    var nTagCount = 0;
    if (pReaderBuffer.buffer)
        nTagCount = pReaderBuffer.buffer.length;

    tb1 = document.getElementById(sReaderDomId + 'body');
    var pReaderTable = document.getElementById('stats' + sReaderDomId);


    pReaderTable.innerHTML = `<div style="width:100%;">
                                <div class="readerstatrow">
                                    <div class="readerstatscell">${pReaderBuffer.started ? 'Encendido' : 'Apagado'}</div>
                                    <div class="semaforo" style="background-color: ${pReaderBuffer.started ? 'green' : 'red'};"></div>
                                </div>
                                <div class="readercountcell" id="countdiv">Tag Count: <strong>${nTagCount}</strong></div>
                            </div>`;

    // First flag as invalid.
    /*for (var i = 0; i < tb1.childNodes.length; i++){
        var pRowToInvalidate = tb1.childNodes[i];
        $(pRowToInvalidate).data('valid', false);
    }*/
    // Add/Update rows, flag as valid if they exist.
    if (pReaderBuffer.buffer) {
        for (var j = 0; j < nTagCount; j++) {
            var pRow = pReaderBuffer.buffer[j];
            var sMainID = pRow.EPC;
            if (!sMainID || sMainID == '') {
                continue;
            }
            var pDivRow = $("#" + sMainID + sReaderDomId);
            if (pDivRow.length > 0) {
                setRowToView(pRow, pDivRow, sReaderDomId);
                pDivRow.data('valid', true);
                continue;
            }

            pDivRow = $("<div class=\"datarow\" />").attr("id", sMainID + sReaderDomId);

            $('#' + sReaderDomId + 'body').append(pDivRow);

            setRowToView(pRow, pDivRow, sReaderDomId);
            pDivRow.data('valid', true);
        }
    }
    // Remove invalid rows.
    /*for (var i = tb1.childNodes.length-1; i >= 0; i--){
        var pRowToCheck = tb1.childNodes[i];
        if ($(pRowToCheck).data('valid') == false)
           $(pRowToCheck).remove();
    }*/
}
function setRowToView(pRow, pDivRow, sReaderDomId) {

    var sMainID = pRow.EPC;
    if (!sMainID || sMainID == '')
        sMainID = pRow.MAC;

    var sRowId = sMainID + sReaderDomId + 'row';
    if (document.getElementById(sRowId)) {
        document.getElementById(sRowId).innerText = sMainID;
        if (document.getElementById(sRowId + 'datetime'))
            document.getElementById(sRowId + 'datetime').innerText = pRow.DateTime;
        /* if (document.getElementById(sRowId+'ant'))
            document.getElementById(sRowId+'ant').innerText = pRow.Antenna; */
        if (document.getElementById(sRowId + 'rn'))
            document.getElementById(sRowId + 'rn').innerText = pRow.ReaderName;
        /* if (document.getElementById(sRowId+'rssi'))
            document.getElementById(sRowId+'rssi').innerText = pRow.PeakRSSI; */
        if (document.getElementById(sRowId + 'startevent'))
            document.getElementById(sRowId + 'startevent').innerText = pRow.Pedido;
    }
    else {
        pDivRow.empty();

        var td1 = "<div class=\"datacell\" id=\"" + sRowId + "\">" + sMainID + "</div>";
        var td2 = "<div class=\"datacell\" id=\"" + sRowId + "datetime\">" + pRow["DateTime"] + "</div>";
        /* var td3="<div class=\"datacell\" id=\""+sRowId+"ant\">"+pRow["Antenna"]+"</div>"; */
        var td4 = "<div class=\"datacell\" id=\"" + sRowId + "rn\">" + pRow["ReaderName"] + "</div>";
        /* var td5="<div class=\"datacell\" id=\""+sRowId+"rssi\">"+pRow["PeakRSSI"]+"</div>"; */
        var td6 = "<div class=\"datacell\" id=\"" + sRowId + "startevent\">" + pRow["Pedido"] + "</div>";

        pDivRow.append(td1 + td2 /* + td3 */ + td4 /* + td5 */ + td6);
    }
}
//
function initHeaderRow(pDivRow) {
    pDivRow.empty();

    var td1 = "<div class=\"datacell\" >EPC</div>";
    var td2 = "<div class=\"datacell\" >Date Time</div>";
    /* var td3="<div class=\"datacell\" >Antenna</div>"; */
    var td4 = "<div class=\"datacell\" >Reader</div>";
    /*  var td5="<div class=\"datacell\" >RSSI</div>"; */
    var td6 = "<div class=\"datacell\" >Pedido</div>";

    pDivRow.append(td1 + td2 /* + td3 */ + td4 /* + td5 */ + td6);
}
//
function getDeviceList(callback) {
    clearStatus();
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            if (this.responseText && this.responseText.length > 0) {
                //alert(this.responseText);
                var aList = JSON.parse(this.responseText);

                if (callback)
                    callback(aList);
            }
        }
    };
    //xhttp.open("GET", getHost() + "/version", true);//"/device/status", true);
    xhttp.open("GET", getHost() + "/device/status", true);
    xhttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhttp.send();
}
//
function getTagsAndStats(callback) {
    clearStatus();
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            if (this.responseText && this.responseText.length > 0) {
                document.getElementById("readerstatus").innerHTML = this.responseText;
                g_aReaderList = JSON.parse(this.responseText);

                for (var h = 0; h < g_aReaderList.devices.length; h++) {

                    var aReaderBuffer = g_aReaderList.devices[h];
                    processReaderBuffer(aReaderBuffer);
                }
                if (callback)
                    callback();
            }
        }
    };
    xhttp.open("GET", getHost() + "/device" + getReaderIdPath() + "/buffer", true);
    xhttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhttp.send();
}
//
function getTags(callback) {
    clearStatus();
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {

            if (this.responseText && this.responseText.length > 0) {
                console.log(this.responseText);
                g_aReaderList = JSON.parse(this.responseText);

                for (var h = 0; h < g_aReaderList.devices.length; h++) {
                    var aReaderBuffer = g_aReaderList.devices[h];
                    processReaderBuffer(aReaderBuffer);
                }
                if (callback)
                    callback();
            }
        }
        else if (this.readyState == 4 && this.status == 500) {
            if (callback)
                callback();
        }
    };
    xhttp.open("GET", getHost() + "/device" + getReaderIdPath(), true);
    xhttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhttp.send();
}
//
function viewtags() {
    getTags();
}
//
function setBufferActiveButton(pReader) {
    if (pReader.bufferactive == true)
        document.getElementById('btnPause').value = 'Pause Buffer';
    else
        document.getElementById('btnPause').value = 'Resume Buffer';
}
//
function startBufferTimer() {
    if (g_bIsLive == true)
        return;

    g_bIsLive = true;
    pollServer();
}
//
function stopBufferTimer() {
    g_bIsLive = false;
}
//
function pollServer() {
    if (g_bIsLive) {
        window.setTimeout(function () {
            getTags(pollServer);
        }, POLL_INTERVAL);
    }
}
//
function posttags() {
    clearStatus();
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {

        if (this.readyState == 4 && (this.status == 200 || this.status == 400 || this.status == 404)) {
            document.getElementById("result").innerHTML = this.responseText;
            //getTags();
        }
    };
    var sFilter = '';
    if (document.getElementById('txtSalesOrder').value != '') {
        sFilter = '{"filters":[{"SalesOrder":"' + document.getElementById('txtSalesOrder').value + '"}]}'
    }
    else {
        console.log(document.getElementById('reader').value);
        console.log(document.getElementsByName('reader').value);
    }
    xhttp.open("PUT", getHost() + "/device" + getReaderIdPath() + "/buffer/flush", true);
    xhttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhttp.send(sFilter);
}
//
function cleartags() {
    clearStatus();
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && (this.status == 200 || this.status == 400 || this.status == 404)) {
            document.getElementById("result").innerHTML = this.responseText;
            console.log('TAG LIST CLEARED');
            getTags();
        }
    };
    xhttp.open("DELETE", getHost() + "/device" + getReaderIdPath() + "/buffer", true);
    xhttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhttp.send();
}
//
function cleargrid() {
    // Remove rows.
    var bRestartTimer = g_bIsLive;
    if (bRestartTimer == true)
        stopBufferTimer();

    var aGrids = document.getElementsByClassName('buffertable');

    for (var j = 0; j < aGrids.length; j++) {
        var sReaderDomId = aGrids[j].id;

        tb1 = document.getElementById(sReaderDomId + 'body');
        if (!tb1)
            continue;
        for (var i = tb1.childNodes.length - 1; i >= 0; i--) {
            var pRowToCheck = tb1.childNodes[i];
            $(pRowToCheck).remove();
        }
    }

    document.getElementById('countdiv').innerHTML = 'Tag Count: <strong>0</strong>';

    if (bRestartTimer == true)
        startBufferTimer();
}
//
function pause(bSetActive) {
    clearStatus();
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && (this.status == 200 || this.status == 400 || this.status == 404)) {
            document.getElementById("result").innerHTML = this.responseText;
        }
    };
    xhttp.open("POST", getHost() + "/device" + getReaderIdPath() + "/buffer/active", true);
    xhttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhttp.send('{"isactive":' + bSetActive + '}');
}
//
function getReaderStatus() {
    clearStatus();
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && (this.status == 200 || this.status == 400 || this.status == 404)) {
            document.getElementById("readerstatus").innerHTML = this.responseText;
        }
    };
    xhttp.open("GET", getHost() + "/device" + getReaderIdPath(), true);
    xhttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhttp.send();
}
//
function startReader() {
    clearStatus();
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {

        if (this.readyState == 4 && (this.status == 200 || this.status == 400 || this.status == 404)) {
            document.getElementById("readerstatus").innerHTML = this.responseText;
        }
    };
    xhttp.open("POST", getHost() + "/device" + getReaderIdPath(), true);
    xhttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhttp.send('{"devices":[{"start":true, "index":"' + document.getElementById('cmbReaderID').value + '"}]}');
}
//
function stopReader() {
    clearStatus();
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {

        if (this.readyState == 4 && (this.status == 200 || this.status == 400 || this.status == 404)) {
            document.getElementById("readerstatus").innerHTML = this.responseText;
        }
    };
    xhttp.open("POST", getHost() + "/device" + getReaderIdPath(), true);
    xhttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

    xhttp.send('{"devices":[{"start":false, "index":"' + document.getElementById('cmbReaderID').value + '"}]}');
}
//
function getHost() {
    var sHost = '';
    if (document.getElementById('txtHost').value != '')
        sHost = document.getElementById('txtHost').value;
    return sHost;
}
//
function getReaderIdPath() {
    var sReaderId = '';
    if (document.getElementById('cmbReaderID').value != '')
        sReaderId = '/' + document.getElementById('cmbReaderID').value;
    return sReaderId;
}
//
function getReaderIdPath_ForTagWrite() {
    var sReaderId = '';
    if (document.getElementById('txtWriteReader').value != '')
        sReaderId = '/' + document.getElementById('txtWriteReader').value;
    return sReaderId;
}
//
function clearStatus() {
    document.getElementById('result').innerHTML = '';
}
//
function refreshReaderList() {
    function setReaderList(list) {
        var pCombo = document.getElementById('cmbReaderID');
        pCombo.options.length = 0;
        var length = pCombo.options.length;
        for (i = 0; i < length; i++) {
            pCombo.options[i] = null;
        }

        for (var h = 0; h < list.devices.length; h++) {
            var pReader = list.devices[h];

            var option = document.createElement("option");
            option.text = pReader.name;
            option.value = pReader.index;

            if (h == sParam_ReaderId)
                option.selected = true;

            pCombo.add(option);
        }
    }

    getDeviceList(setReaderList);
}

function initForm() {

    refreshReaderList();

    if (!sParam_ReaderId || sParam_ReaderId.length <= 0)
        return;

    //document.getElementById('cmbReaderID').value = sParam_ReaderId;
    startBufferTimer();

    processReaderBuffer({ started: false });
}

function actualizar() {

    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/x-www-form-urlencoded");

    var customPropValue = document.getElementById('txtSalesOrder').value.trim()

    if (customPropValue === "") {
        alert("Por favor, ingrese el numero de pedido.");
        return;
    }

    var raw = JSON.stringify([
        {
            "CUSTOMPROP": customPropValue
        }
    ]);

    var requestOptions = {
        //mode: 'no-cors',
        method: 'POST',
        headers: myHeaders,
        body: raw,
        redirect: 'follow'
    };

    fetch("http://localhost:4405/device/0/properties", requestOptions)
        .then(response => response.json())
        .then(result => console.log("Nueva orden", result))
        .catch(error => console.log('error', error));

    mostrarBotones();
    alert("Pedido actualizado exitosamente!")
}

function mostrarBotones() {
    // Muestra los botones
    document.getElementById('btnEncender').style.display = 'inline-block';
    document.getElementById('btnApagar').style.display = 'inline-block';
    document.getElementById('btnLimpiar').style.display = 'inline-block';
}

function initForm() {
    // Oculta los botones al cargar la página
    ocultarBotones();

    refreshReaderList();

    // ...
}

function ocultarBotones() {
    // Oculta los botones
    document.getElementById('btnEncender').style.display = 'none';
    document.getElementById('btnApagar').style.display = 'none';
    document.getElementById('btnLimpiar').style.display = 'none';
}

