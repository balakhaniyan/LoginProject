"use strict";

import "core-js/stable";
import "./../style/visual.less";
import "./../style/style.css";
import "./../style/Slider.css";
import "./../style/Tablo.css";
import powerbi from "powerbi-visuals-api";
import * as $ from 'JQuery';
import powerbiVisualsApi from "powerbi-visuals-api";
import {VisualSettings} from "./settings";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import DataView = powerbi.DataView;
import host = powerbi.extensibility.IVisualHost;
import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;
import FilterAction = powerbi.FilterAction;
import data = powerbi.data;
import visual = powerbi.extensibility.visual;
import visuals = powerbi.visuals;
import DataViewCategoricalColumn = powerbi.DataViewCategoricalColumn;
import extensibility = powerbi.extensibility;
import apply = Reflect.apply;
import IVisualHost = powerbiVisualsApi.extensibility.visual.IVisualHost;
import {dataViewObject} from "powerbi-visuals-utils-dataviewutils";

import {
    interactivityBaseService,
    interactivitySelectionService,
    interactivityFilterService,
} from "powerbi-visuals-utils-interactivityutils";


import createInteractivityFilterService = interactivityFilterService.createInteractivityFilterService;

/**
 * this class written from scratch for double-style slider
 * it takes an object (hash) as param and create a slider
 * css code written in Slider.scss in Sassy CSS format and can refine easily
 */

import {
    IFilter,
    Filter,
    PrimitiveValueType,
    // IBasicFilter,
    BasicFilter,
    IAdvancedFilter,
    AdvancedFilter,
    // IAdvancedFilterCondition,
    IFilterColumnTarget,
} from "powerbi-models";
import {FilterDataPoint} from "powerbi-visuals-utils-interactivityutils/lib/interactivityFilterService";

// import powerbiVisualsApi from "powerbi-visuals-api";
import ValueRange = powerbiVisualsApi.ValueRange;

import IInteractiveBehavior = interactivityBaseService.IInteractiveBehavior;
import IInteractivityService = interactivityBaseService.IInteractivityService;
import IFilterBehaviorOptions = interactivityFilterService.IFilterBehaviorOptions;
import IBehaviorOptions = interactivityBaseService.IBehaviorOptions;
import ISelectionHandler = interactivityBaseService.ISelectionHandler;
// import { Settings } from "./settings";
// import { ScalableRange } from "./scalableRange";
// import { SampleSlicerDataPoint, SampleSlicerCallbacks } from "./sampleSlicer";
export interface SampleSlicerCallbacks {
    // getPersistedSelectionState?: () => ISelectionId[];
    restorePersistedRangeSelectionState?: () => void;
    applyFilter?: (filter: IFilter) => void;
    getFilterColumnTarget?: () => IFilterColumnTarget;
}

export interface SampleSlicerBehaviorOptions extends IFilterBehaviorOptions {
    // slicerItemContainers: Selection<FilterDataPoint>;
    // dataPoints: SampleSlicerDataPoint[];
    interactivityService: IInteractivityService<any>;
    // slicerSettings: Settings;
}

class Slider {
    private readonly input: JQuery; // the input that must has a slider and define in instantiation
    private readonly parent: JQuery; // a div that contains (wrap) input and all slider elements
    private readonly holder: JQuery; // a div that is main section of slider (default color: grey) all other slider elements are placed on this
    private readonly leftHead: JQuery; // left handle for selecting min value
    private readonly rightHead: JQuery; // right handle for selecting Max value
    private readonly body: JQuery; // the distance between two handles that moves by handles (default color: red)
    private readonly head: JQuery; // both handles for special usages
    private static headsClass: string[] = ['slider-head', 'slider-left-head', 'slider-right-head']; // define an array of handles classes for fast switching and selecting
    private whichHeadMustMove: number = 0; // which handle is focused on by mouse down and used headsClass array
    private readonly range: number[]; // user input for minimum and maximum possible values

    /**
     * predefined function that use for chnage the value in user favourite style
     * @example timestamp: 5236547892 to 2018/03/15
     * this method define anonymously by user
     * in predefined format it doesnt do anything
     * @param x : minimum value that returns by slider to user method
     * @param y : maximum value that returns by slider to user method
     * @return an array that contains user formats
     */
    private readonly prettify = (x: number, y: number) => {
        return [x, y]
    };
    /**
     * a method that defined by user and runs when handles position changed
     * it runs automatically and can use by prettify method
     * @param x : min value that returns by slider to user method
     * @param y : maximum value that returns by slider to user method
     * @example change an input value when positions changed
     */
    private readonly onChange = (x: number, y: number) => {
        return [x, y]
    }
    /**
     * a method that run by min an Max value when slider set
     * that done like other user-defined methods
     * @param x : min value that returns by slider to user method
     * @param y : maximum value that returns by slider to user method
     * @example runs when slider created
     */
    private readonly onStart = (x: number, y: number) => {
        return [x, y]
    }
    /**
     * a method that defined by user and runs when handles dropped
     * it runs automatically and can use by prettify method
     * @param x : min value that returns by slider to user method
     * @param y : maximum value that returns by slider to user method
     * @example change an input value when positions dropped
     */
    private readonly onUpdate = (x: number, y: number) => {
        return [x, y]
    }

    /**
     * it takes values that set by handle position and range and prettify as data
     * and set bubble values at the moment handles moved
     * @param data: prettified min and max values as array
     */
    setBubbles(data: number[]) {
        this.leftHead.find('.bubble').text(data[0]);
        this.rightHead.find('.bubble').text(data[1]);
    }

    /**
     * it has an anonymously method that find value of min and max in range
     * @function setNumber: it takes handle and find its relative pos and calculate exact value by range
     * @example the pos is 120 and in percent 25 and by 0-10 range is = 2.5 and rounded 2
     * it return all data is array
     * @return exact values for min and max according to range
     */
    private setNumbers() {
        let setPercent = (head: JQuery) => {
            return Math.round((Math.abs(head.offset().left - this.holder.offset().left) / (this.holder.width())) * (this.range[1] - this.range[0]) + this.range[0])
        }
        return [setPercent(this.leftHead), setPercent(this.rightHead)];
    }

    /**
     * when handles moved this method runs
     * it get data and min and max values and set it to bubbles
     * and run user-defined onChange method
     */
    private getNumbersForBubble() {
        let data = this.setNumbers();
        this.setBubbles(this.prettify(data[0], data[1]));
        this.onChange(data[0], data[1]);
    }

    /**
     *
     */
    private headMoved() {
        if (this.whichHeadMustMove !== 0) {
            let data = this.setNumbers();
            this.onUpdate(data[0], data[1]);
            this.getNumbersForBubble();
        }
        this.whichHeadMustMove = 0;

    }

    private moveBody() {
        let headWidth: number = 2;
        let leftHeadLeft = parseInt(this.leftHead.css('left')) + headWidth;
        let rightHeadLeft = parseInt(this.rightHead.css('left'));
        this.body.css('left', (leftHeadLeft / this.holder.width() * 100).toString() + '%');
        this.body.css('width', ((rightHeadLeft - leftHeadLeft + headWidth - 1) / this.holder.width() * 100).toString() + '%');
    }

    private setHeadPosWithClick(ox: number, whichHead = 0) {
        let holderOffsetLeft: number = this.holder.offset().left;
        ox = ox - holderOffsetLeft;
        let distances: number[] = [Math.abs(this.leftHead.offset().left - ox), Math.abs(this.rightHead.offset().left - ox)];
        let pxPercent: string = (ox / (this.holder.width()) * 100).toString() + '%';
        if (whichHead === 0) {
            if (distances[0] < distances[1])
                this.leftHead.css('left', pxPercent)
            else
                this.rightHead.css('left', pxPercent)
        } else if (whichHead === 1) {
            this.leftHead.css('left', pxPercent)
        } else {
            if (this.leftHead.offset().left <= ox + this.holder.offset().left)
                this.rightHead.css('left', pxPercent)
        }
        this.moveBody();
        this.getNumbersForBubble();
        let data = this.setNumbers();
        this.onUpdate(data[0], data[1]);
    }

    private setHeadPosWithDrag(px) {
        let holderOffsetLeft: number = this.holder.offset().left;
        if (this.whichHeadMustMove != 0 && (Math.floor(px) <= Math.floor(holderOffsetLeft) || Math.floor(holderOffsetLeft + this.holder.width()) <= Math.floor(px))) {
            this.headMoved();
            return
        }
        px = px - holderOffsetLeft;
        let pxPercent: string = (px / (this.holder.width()) * 100).toString() + '%';
        if (this.whichHeadMustMove === 1 && px <= this.rightHead.offset().left - holderOffsetLeft) {
            this.leftHead.css('left', pxPercent);
            this.getNumbersForBubble();
        } else if (this.whichHeadMustMove === 2 && px >= this.leftHead.offset().left - holderOffsetLeft) {
            this.rightHead.css('left', pxPercent);
            this.getNumbersForBubble();
        }
    }

    constructor(option: object) {
        let _self = this;
        if (option['prettify'] !== undefined)
            this.prettify = option['prettify'];
        if (option['onChange'] !== undefined)
            this.onChange = option['onChange'];
        if (option['onStart'] !== undefined)
            this.onStart = option['onStart'];
        if (option['onUpdate'] !== undefined)
            this.onUpdate = option['onUpdate'];
        this.range = option['range'];
        this.input = $(`#${option['input']}`);
        this.input.css('display', 'none');
        this.input.wrap('<div class="slider-parent"></div>');
        this.parent = this.input.parent();
        this.parent.append('<div class="slider-holder"><span class="legend"></span><span class="legend"></span><span class="legend"></span><span class="legend"></span><span class="legend"></span></div>');
        this.holder = this.parent.find('.slider-holder');
        this.holder.append('<div class="slider-head slider-left-head"><div class="bubble"></div></div><div class="slider-body"></div><div class="slider-head slider-right-head"><div class="bubble"></div></div>');
        this.leftHead = this.holder.find('.slider-left-head');
        this.rightHead = this.holder.find('.slider-right-head');
        this.rightHead.css('left', '50%');
        this.body = this.holder.find('.slider-body');
        this.head = this.holder.find('.slider-head');
        this.moveBody();
        this.head.on('mousedown', function () {
            _self.whichHeadMustMove = $(this).hasClass(Slider.headsClass[1]) ? 1 : 2;
        })

        $('html').on('mousemove', function (e) {
            _self.setHeadPosWithDrag(e.pageX);
            _self.moveBody();
        }).on('mouseup', function () {
            _self.headMoved();
        });
        this.holder.on('click', function (e) {
            if (!$(e.target).hasClass(Slider.headsClass[0])) {
                _self.setHeadPosWithClick(e.pageX);
            }
        });
        let data = this.setNumbers();
        let i = 0, number;
        this.holder.find('.legend').each(function () {
            number = Math.round(i * (_self.range[1] - _self.range[0]) / 100) + _self.range[0];
            $(this).append(`|<br><span>${_self.prettify(number, 1)[0]}</span>`);
            i += 25;
        });
        let initialsValues = option['initialValues'];
        this.setHeadPosWithClick(this.setFromToForPos(initialsValues[0]) * (this.holder.width()) + this.holder.offset().left, 1);
        this.setHeadPosWithClick(this.setFromToForPos(initialsValues[1]) * (this.holder.width()) + this.holder.offset().left, 2);
        this.onStart(data[0], data[1]);
    }

    private setFromToForPos(num) {
        return (parseInt(num) - this.range[0]) / (this.range[1] - this.range[0])
    }

    public setSliderChanger(params) {
        let _self = this;
        let from, to;
        if (params['from'] != undefined) {
            from = _self.setFromToForPos((params['from'] + 24 * 60 * 60 * 100));
            if (from >= 0)
                _self.setHeadPosWithClick(from * (this.holder.width()) + this.holder.offset().left, 1)
        }
        if (params['to'] != undefined) {
            to = _self.setFromToForPos((params['to'] + 24 * 60 * 60 * 100));
            if (to <= 1)
                _self.setHeadPosWithClick(to * (this.holder.width()) + this.holder.offset().left, 2)
        }
    }
}

class PersianFormat {
    public static readonly _jalali_months: string[] = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
    private static readonly _persianNumbers: RegExp[] = [/۰/g, /۱/g, /۲/g, /۳/g, /۴/g, /۵/g, /۶/g, /۷/g, /۸/g, /۹/g];
    private static readonly _onlyPersianNumbers: string[] = PersianFormat._persianNumbers.map((x: RegExp) => {
        return x.toString().substr(1, 1)
    });
    public static readonly jal_month_days: number[] = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];

    public static isLeapYear(year: number): boolean {
        let remain_nums = [0, 4, 8, 12, 16, 20, 24, 29, 33, 37, 41, 45, 49, 53, 57, 62, 66, 70, 74, 78, 82, 86, 90, 95, 99, 103, 107, 111, 115, 119, 124]
        return remain_nums.indexOf(year % 128) !== -1;
    }

    public static fixNumbers(str: string, cmd: number = 0): string {
        if (cmd === 0)
            for (let i = 0; i < 10; i++)
                str = str.replace(PersianFormat._persianNumbers[i], i.toString());
        else
            for (let i = 0; i < 10; i++)
                str = str.split(i.toString()).join(PersianFormat._onlyPersianNumbers[i]);
        return str;
    };

    public static getMinMaxDates(dates) {
        let data = dates.map(function (x) {
            return PersianFormat.getTimestampFromStandardPersian(x);
        })
        let index = data.indexOf(NaN);
        if (index !== -1) data.splice(index, 1);
        return [(dates[data.indexOf(Math.min(...data))]), (dates[data.indexOf(Math.max(...data))])];
    }

    public static setDatesStringStandardArrays(dates, separator: string = '/') {
        return dates.map(function (x) {
            return x.split(separator).map(function (y) {
                return parseInt(y)
            }).reverse();
        })
    }

    public static getTimestampFromInput(date) {
        let datePersian = (date.toString().split(' '));
        datePersian = [PersianFormat.fixNumbers(datePersian[0]), (PersianFormat._jalali_months.indexOf(datePersian[1])).toString(), PersianFormat.fixNumbers(datePersian[2])]
        let dateJalali = (datePersian.map(function (x) {
            return parseInt(x)
        }));
        return (PersianFormat.dateToGre(dateJalali.reverse()).valueOf())
    }

    public static getTimestampFromStandardPersian(date: string, separator: string = '/') {
        let dateArr: string[] | number[] = date.split(separator);
        dateArr = dateArr.map(function (x) {
            return parseInt(x)
        }).reverse();
        dateArr[1] -= 1;
        return PersianFormat.dateToGre(dateArr).valueOf();
    }

    public static dateToGre(date: number[]): Date {
        let [y, m, d] = date;
        let gy = y + 621, gm, gd;
        gy = (m >= 10 && d >= 11) ? gy + 1 : gy;
        if (m === 11 && 1 <= d && d <= 10) {
            gy++;
        } else if (m == 10 && d == 11) {
            gy--;
        }
        let month_floor = [11, 10, 10, 9, 9, 9, 8, 9, 9, 10, 11, 9];
        if (d > month_floor[m]) {
            gm = (m + 3) % 12;
            gd = (d - month_floor[m])
        } else {
            gm = (m + 2) % 12;
            gd = d + PersianFormat.jal_month_days[(m === 0) ? 11 : m - 1] - (month_floor[(m === 0) ? 11 : m - 1]);
        }
        gm = (gm == 0) ? 12 : gm;
        if (PersianFormat.isLeapYear(y)) {
            gd -= 1;
        }
        return new Date(gy, gm, gd);
    }

    public static dateToTS(y: number, m: number, d: number): number {
        return PersianFormat.dateToGre([y, m, d]).valueOf();
    }

    public static dateSetter(date, separator, order) {
        let dateArr = date.split(separator).map((a) => {
            return parseInt(a)
        })
        dateArr = order.map((a) => {
            return dateArr[a - 1]
        });
        return dateArr;
    }

    public static dateToTSByArr(date) {
        return this.dateToTS(date[0], date[1], date[2]);
    }

    public static setterAndToTS(date, separator = '/', order = [1, 2, 3]) {
        return PersianFormat.dateToTSByArr(PersianFormat.dateSetter(date, separator, order))
    }

    public static tsToDate(date: number): string {
        let loc = "fa-IR"
        let d = new Date(date);
        return d.toLocaleDateString(loc, {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }
}

interface ITablo {
    addData(data: any[] | object): void;

    addDatas(data: object[]): void;

    insertDataAtIndex(index: number, data: any[] | object): void;

    removeDataByRow(row_num: number): void;

    removeDataByRows(rows: number[], setByChange: boolean): void;

    removeDataByColumnValue(rowData: object): void;

    getData(index: number, objectType: boolean): any[] | object;

    empty();
}


class Tablo implements ITablo {
    public static dataTypes: object = {
        str: 'String',
        num: 'Number',
        flt: 'Float',
        dte: 'Date',
        img: 'Image'
    };
    public static langs: object = {
        en: false,
        fa: true,
    };
    // private static dateRowsClasses: string[] = ['even', 'odd'];
    private data: any[] = [];
    private readonly lang: number;
    private readonly table: JQuery;
    private readonly container: JQuery;
    private readonly thead: JQuery;
    private readonly tbody: JQuery;
    private readonly pageMenu: JQuery;
    private readonly tableHeaders: object;
    private readonly packSize: number = 100000;
    private packNum: number = 0;
    private row_num: number = 1;
    private activePage = 1;
    private readonly has_row: boolean = true;
    private sortOrder = {}
    private countingForSort = 0; // this is the number of table headers

    constructor(options: object) {
        if (options['row_num'] !== undefined && options['row_num'] === false) {
            this.has_row = false;
        }
        if (options['pack_size'] != undefined && options['pack_size'] >= 1) {
            this.packSize = options['pack_size']
        }
        this.table = $(`#${options['table']}`);
        this.lang = Tablo.langs[options['lang']];
        this.table.wrap('<div class="table-container"></div>')
        this.container = this.table.parent();
        this.container.append('<div class="page-menu"><table class="main"><tr></tr></table></div>')
        this.pageMenu = this.container.find('.page-menu');
        this.setPagination()
        this.table.addClass('tablo');
        this.table.append('<thead></thead>');
        this.thead = this.table.find('thead');
        this.table.append('<tbody></tbody>');
        this.tbody = this.table.find('tbody');
        this.tableHeaders = options['tableHeaders'];
        let _self = this;
        if (this.lang)
            this.countingForSort = Object.keys(this.tableHeaders).length
        if (this.row_num > 0) {
            this.thead.append(`<td>${(this.lang ? 'ردیف' : 'No.')}</td>`)
        }
        let orderSorter = (t, order) => {
            _self.sortOrder[Math.abs(_self.countingForSort - _self.thead.find('td').index(t))] = parseInt(PersianFormat.fixNumbers(order.text()))
            let orders = (Object.keys(_self.sortOrder).sort(function (a, b) {
                return -1 * (_self.sortOrder[a] - _self.sortOrder[b])
            }))
            _self.sort(orders.map((x) => {
                return [parseInt(x) - 1, 1]
            }));
        }
        for (let key of Object.keys(this.tableHeaders)) {
            if (this.lang)
                this.thead.prepend(`<td>${key}<span class="order">${_self.setNum(0)}</span></td>`);
            else this.thead.append(`<td>${key}<span class="order">0</span></td>`)
        }
        this.thead.find('td').on('click', function (e) {
            if ($(e.target).attr('class') === 'order')
                return
            let order = $(this).find('.order');
            if (order.text() == '') {
                order.text(_self.setNum(1));
            } else {
                order.text(_self.setNum(parseInt(PersianFormat.fixNumbers(order.text())) + 1))
            }
            orderSorter(this, order)
        }).find('.order').on('click', function () {
            let order = $(this)
            if (PersianFormat.fixNumbers(order.text()) === '1')
                order.text()
            else
                order.text(_self.setNum(parseInt(PersianFormat.fixNumbers(order.text())) - 1))
            orderSorter($(this).parent(), order)
        })
    }

    private setPagination() {
        let pageMenuMain = this.pageMenu.find('.main tr');
        this.pageMenu.addClass('none-display');
        let num: string;
        for (let i = 0; i < 7; i++) {
            num = this.setNum(i + 1);
            if (this.lang)
                pageMenuMain.prepend(`<td class="page-index">${num}</td>`);
            else
                pageMenuMain.append(`<td class="page-index">${num}</td>`);
        }
        let _self = this
        pageMenuMain.find('.page-index').on('click', function () {
            _self.setActivePage(parseInt(PersianFormat.fixNumbers($(this).text())))
        });
        this.setActivePage(1);
    }

    private updatePagination() {
        let packNum = (Math.floor((this.data.length - 1) / this.packSize));
        if (packNum === this.packNum)
            return
        this.packNum = packNum;
        if (this.packNum > 0)
            this.pageMenu.removeClass('none-display');
        else
            this.pageMenu.addClass('none-display');
        let pageMenuOptions: HTMLElement[] = this.pageMenu.find('.main tr td').get();
        if (this.lang)
            pageMenuOptions = pageMenuOptions.reverse();
        let _self = this;
        if (packNum < 7) {
            $(pageMenuOptions).each(function (i) {
                if (i <= _self.packNum) {
                    $(this).text(_self.setNum(i + 1));
                    $(this).removeClass('none-display');
                } else {
                    $(this).addClass('none-display');
                }
            });
        } else if (this.packNum >= 7) {
            $(pageMenuOptions).last().text(this.setNum(this.packNum + 1))
        }
    }

    public setActivePage(ap: number) {
        let pageMenuOptions: HTMLElement[] = this.pageMenu.find('.main tr td').get();
        if (this.lang)
            pageMenuOptions = pageMenuOptions.reverse();
        let _self = this;
        this.activePage = ap;
        if (this.packNum > 6) {
            let setPageNumbers = (ap, arrow) => {
                if (arrow === -1) {
                    ap = this.packNum + 1
                    pageMenuOptions = pageMenuOptions.reverse();
                } else ap = 1;
                $(pageMenuOptions).each(function () {
                    $(this).text(_self.setNum(ap));
                    ap += arrow;
                });
                $(pageMenuOptions).last().text(this.setNum((arrow === 1) ? this.packNum + 1 : 1));
            }
            if (this.packNum < 7)
                return

            if (this.activePage <= 3) {
                setPageNumbers(ap, 1);
            } else if (this.activePage >= this.packNum - 1) {
                setPageNumbers(ap, -1)
            } else {
                ap -= 2;
                $(pageMenuOptions).slice(-6).each(function () {
                    $(this).text(_self.setNum(ap++));
                });
                $(pageMenuOptions).first().text(this.setNum(1))
                $(pageMenuOptions).last().text(this.setNum(this.packNum + 1))
            }
        }
        let className: string = 'selected-page-index';
        this.pageMenu.find(`.${className}`).removeClass(className)
        $(pageMenuOptions).each(function () {
            if (PersianFormat.fixNumbers($(this).text()) === _self.activePage.toString()) {
                $(this).addClass(className);
            }
        })
        this.updateTable();
    }

    private updateTable() {
        let _self = this;
        let setUndisplay: boolean = false;
        let rowNum: number = (_self.activePage - 1) * _self.packSize + 1;
        this.table.find('tr.none-display').removeClass('none-display')
        this.table.find('tr.data').each(function () {
            $(this).find('.row').text(_self.setNum(rowNum));
            let set_i;
            $(this).find('td.data-cell').each(function (i) {
                set_i = (_self.lang) ? Object.keys(_self.tableHeaders).length - 1 - i : i
                $(this).text(_self.setNum(_self.data[rowNum - 1][set_i]));
            });
            rowNum++;
            if (rowNum >= _self.data.length + 1) {
                setUndisplay = true;
                return false;
            }
        });
        if (setUndisplay)
            this.table.find('tr.data')
                .slice(-1 * (_self.packSize - (rowNum - 1) % _self.packSize))
                .addClass('none-display').prev('.space')
                .addClass('none-display');
    }

    private convertArrToObject(data: any[]): object {
        let keys: string[] = Object.keys(this.tableHeaders);
        let resData: object = {}
        for (let i = 0; i < data.length; i++) {
            resData[keys[i]] = data[i];
        }
        return resData;
    }


    public getData(index: number, objectType = false): any[] | object {
        let data = this.data[index - 1];
        if (!objectType)
            return data;
        return this.convertArrToObject(data);
    }

    private createDataRow(data) {
        let trow = $(`<tr class="data ${(this.row_num % 2 == 0 ? 'even' : 'odd')}"></tr>`);
        let space = $(`<tr class="space"></tr>`);
        let num: string = this.setNum(this.row_num++);
        if (this.row_num > 0)
            trow.append(`<td class="row">${num}</td>`);
        for (let cell of data) {
            num = this.setNum(cell);
            if (this.lang) {
                trow.prepend(`<td class="data-cell">${num}</td>`)
            } else {
                trow.append(`<td class="data-cell">${num}</td>`)
            }
        }
        this.updatePagination();
        return [space, trow];
    }

    public addData(data) {
        this.data.push(data);
        let [space, trow] = this.createDataRow(data);
        if (this.packSize === 100000 || this.activePage === this.packNum + 1)
            this.tbody.append(space).append(trow)
    }

    public addDatas(rows) {
        for (let row of rows) {
            this.addData(row);
        }
    }

    private setNum(index: number): string {
        if (this.lang) {
            return PersianFormat.fixNumbers(index.toString(), 1);
        }
        return index.toString();
    }

    /*

     */
    public insertDataAtIndex(index: number, data: any[], mustInsert: boolean = true): void {
        let toggleRowClass = (tr: JQuery, added: string, removed: string): void => {
            tr.addClass(added).removeClass(removed);
        }
        let providedToggles = (tr, which = 1) => {
            if (which === 1)
                toggleRowClass(tr, 'odd', 'even');
            else
                toggleRowClass(tr, 'even', 'odd');
        }
        let elem: JQuery = (this.trByIndex(index - 1));
        let [space, trow] = this.createDataRow(data);
        space.insertAfter(elem)
        trow.insertAfter(space);
        if (this.trByIndex(index - 1).hasClass('odd')) {
            providedToggles(trow, 2)
        } else {
            providedToggles(trow)
        }
        if (mustInsert) {
            this.data.splice(index - 1, 0, data);
            this.setRowsNums(index);
        }
        trow.find('.row').text(this.setNum(index))
    }

    private trByIndex(rn: number): JQuery {
        return this.tbody.find(`tr.data`).eq(rn - 1);
    }

    private setRowsNums(row_num) {
        let classToggle = (this.trByIndex(row_num % this.packSize).hasClass('even')) ? 0 : 1;
        let num: string;
        for (let i = row_num + 1; i <= this.packSize * (Math.floor(row_num / this.packSize) + 1); i += 1) {

            num = this.setNum(i);
            let j = i % this.packSize;
            this.trByIndex((j != 0) ? j : this.packSize).find('td.row').text(num);
            this.trByIndex((j != 0) ? j : this.packSize).addClass((classToggle % 2 === 0) ? 'odd' : 'even').removeClass((classToggle++ % 2 === 0) ? 'even' : 'odd');
        }
    }

    public removeDataByRow(row_num) {
        let firstRowNum = (this.activePage - 1) * this.packSize;
        if (firstRowNum < row_num && row_num < firstRowNum + this.packSize) {
            this.trByIndex(row_num % this.packSize).next().remove();
            this.trByIndex(row_num % this.packSize).remove();
            this.setRowsNums(row_num - 1);
            let addedIndex = Math.floor(row_num / this.packSize + 1) * this.packSize;
            this.data.splice(row_num - 1, 1);
            this.insertDataAtIndex(this.packSize, this.data[addedIndex - 1], false);
            this.table.find('.data').last().find('.row').text(this.setNum(addedIndex))
        } else {
            this.data.splice(row_num - 1, 1);
            this.row_num--;
        }
        this.updatePagination();
    }

    public removeDataByRows(rows, setByChange = false) {
        if (!setByChange) {
            rows = rows.sort();
            let num: number;
            for (let i = 0; i < rows.length - 1; i++) {
                num = rows[i]
                for (let j = i + 1; j < rows.length; j++) {
                    if (rows[j] > num)
                        rows[j]--;
                }
            }
        }
        for (let row of rows) {
            this.removeDataByRow(row);
        }
    }

    public sort(option: number[][]) {
        let types = Object.keys(this.tableHeaders).map(k => this.tableHeaders[k])
        let sorter = (a, b, option, which) => {
            if (types[option[which][0]] === 'String') {
                if (a[option[which][0]].localeCompare([option[which][0]]) === 0)
                    if (which < length - 1)
                        return sorter(a, b, option, which + 1)
                    else return 0
                else {
                    return option[which][1] * a[option[which][0]].localeCompare(b[option[which][0]])
                }
            } else {
                let x, y;
                if (types[option[which][0]] === 'Date') {
                    x = PersianFormat.setterAndToTS(a[option[which][0]], '/', [3, 2, 1])
                    y = PersianFormat.setterAndToTS(b[option[which][0]], '/', [3, 2, 1])
                } else if (types[option[which][0]] === 'Number') {
                    x = parseFloat(a[option[which][0]]);
                    y = parseFloat(b[option[which][0]]);
                } else {
                    x = a[option[which][0]];
                    y = b[option[which][0]]
                }
                if (x === y) {
                    if (which < length - 1)
                        return sorter(a, b, option, which + 1)
                    else return 0
                } else {
                    return option[which][1] * ((x < y) ? -1 : 1);
                }
            }
        }
        this.data.sort(function (a, b) {
            return sorter(a, b, option, 0)
        });
        this.setActivePage(1);
    }

    public empty() {
        this.tbody.empty();
        this.data = [];
        this.row_num = 1;
        this.pageMenu.addClass('none-display');
    }

    public removeDataByColumnValue(rowData) {
        let keys = []
        for (let key of Object.keys(rowData)) {
            if (typeof key === 'number')
                keys.push(key)
            else
                keys.push(Object.keys(this.tableHeaders).indexOf(key))
        }

    }
}

class Calendar {
    private readonly elem: JQuery;
    private readonly holder: JQuery;
    private next: JQuery;
    private prev: JQuery;
    private year: JQuery;
    private month: JQuery;
    private today: JQuery;
    private thead: JQuery;
    private tbody: JQuery;
    private readonly fromTo: number[];
    private readonly sliderHeader: string;
    private readonly slider: Slider;

    setCalendar(): void {
        this.holder.append(`<div class="calendar"></div>`)
    }

    private addCalendarParts() {
        this.setCalendar();
        this.holder.find('.calendar').append(`<div class="header">
                <span class="change prev">قبلی</span>
                <span class="select-holder"><select class="year"></select><select class="month"></select></span>
                <span class="change next">بعدی</span>
                </div><div class="body"><table><thead></thead><tbody></tbody></table></div><div class="footer today">امروز</div>`);
        this.next = this.holder.find('.next');
        this.prev = this.holder.find('.prev');
        this.year = this.holder.find('.year');
        this.month = this.holder.find('.month');
        this.today = this.holder.find('.today');
        this.thead = this.holder.find('thead');
        this.tbody = this.holder.find('tbody');
    }

    private addMonthYearData() {
        for (let month of PersianFormat._jalali_months) {
            this.month.append(`<option value="${month}">${month}</option>`)
        }
        for (let i = this.fromTo[0]; i <= this.fromTo[1]; i++) {
            this.year.append(`<option value="${i}">${PersianFormat.fixNumbers((i).toString(), 1)}</option>`)
        }
        this.month.find('.option').css('visibility', 'visible')
        this.year.find('.option').css('visibility', 'visible')
    }

    private setTableRows() {
        for (let day_name of ['', 'یک', 'دو', 'سه ', 'چهار', 'پنج', 'جمعه'].reverse()) {
            this.thead.append(`<td>${(day_name == 'جمعه') ? day_name : day_name + 'شنبه'}</td>`);
        }
        for (let j = 1; j <= 6; j++) {
            let tr = $(`<tr></tr>`)
            for (let i = 1; i <= 7; i++) {
                tr.append(`<td class="${(i == 1) ? "weekend" : ""}"><span class="jalali"></span><span class="gregorian"></span></td>`);
            }
            this.tbody.append(tr);
        }
    }

    showCalendar() {
        let elem_date = PersianFormat.fixNumbers(this.elem.val().toString()).split(' ');
        this.month.val(elem_date[1]);
        this.year.val(elem_date[2]);
    }

    setMonthYear() {
        this.updateTable();
        $(this).find('option').css('visibility', 'visible')
    }

    updateTable() {
        let getGregorianDate = (day) => {
            return PersianFormat.dateToGre([this_year, mon_index, day]).getDate().toString()
        }
        let this_month = this.month.val().toString();
        let this_year = parseInt(this.year.val().toString());
        let mon_index = PersianFormat._jalali_months.indexOf(this_month);
        let g_date = PersianFormat.dateToGre([(this_year), mon_index, 1]);
        let weekday = g_date.getDay();
        let j = 0, i = 1;
        let m_days = PersianFormat.jal_month_days[PersianFormat._jalali_months.indexOf(this_month)];
        weekday = ((weekday + 1) % 7);
        let isLeap = PersianFormat.isLeapYear(this_year);
        this.tbody.find('tr').each(function () {
                let tds = $(this).find('td');
                for (let k = 0; k < 7; k++) {
                    if (i <= m_days || (mon_index === 11 && isLeap && i === 30)) {
                        if (j >= weekday) {
                            $(tds[6 - k]).css('visibility', 'visible')
                                .attr('data-date', i).find('.jalali')
                                .text(PersianFormat.fixNumbers((i).toString(), 1))
                                .parent().find('.gregorian')
                                .text(getGregorianDate(i++));
                        } else $(tds[6 - k]).css('visibility', 'hidden');
                    } else $(tds[6 - k]).css('visibility', 'hidden');
                    j++;
                }
            }
        );
        this.holder.find('td.today').removeClass('today');
        this.holder.find('td.selected-day').removeClass('selected-day');
        this.setToday(1);
        setTimeout(() => {
            this.selectedDay();
        }, 10);
    }

    nextPrev(cmd = 0) {
        let _self = this;
        let month_num = (PersianFormat._jalali_months.indexOf(_self.month.val().toString()));
        let year_num = parseInt(_self.year.val().toString());
        if (cmd == 1) {
            if (month_num === 11) {
                if (year_num !== this.fromTo[1]) {
                    _self.year.val((year_num + 1).toString());
                    _self.month.val(PersianFormat._jalali_months[0]);
                }
            } else
                _self.month.val(PersianFormat._jalali_months[month_num + 1]);
        } else {
            if (month_num === 0) {
                if (year_num != this.fromTo[0]) {
                    _self.year.val((year_num - 1).toString());
                    _self.month.val(PersianFormat._jalali_months[11]);
                }
            } else
                _self.month.val(PersianFormat._jalali_months[month_num - 1]);
        }
        _self.holder.find('td').removeClass('today');
        _self.updateTable();
        _self.selectedDay();
    }

    setToday(cmd = 0) {
        let today = (PersianFormat.fixNumbers(new Date().toLocaleDateString('fa-IR')).split('/'))
        if (cmd === 0) {
            this.month.val(PersianFormat._jalali_months[parseInt(today[1]) - 1]);
            this.year.val(today[0]);
            this.updateTable();
        }
        let calDate = [this.year.val().toString(), (PersianFormat._jalali_months.indexOf(this.month.val().toString()) + 1).toString()]
        setTimeout(() => {
            if (today[0] === calDate[0] && today[1] === calDate[1])
                this.tbody.find(`td[data-date=${today[2]}]`).addClass('today');
        }, 10);
    }


    selectedDay() {
        let sel_year = parseInt((this.year.val()).toString());
        let sel_month = PersianFormat._jalali_months.indexOf((this.month.val()).toString());
        let date = PersianFormat.fixNumbers(this.elem.val().toString()).split(' ');
        if (sel_month === PersianFormat._jalali_months.indexOf(date[1]) && sel_year === parseInt(date[2])) {
            setTimeout(() => {
                this.tbody
                    .find(`td[data-date=${date[0]}]`).addClass('selected-day');
            }, 10);
        }
    }

    updateSlider(day) {
        let month = PersianFormat._jalali_months.indexOf(this.month.val().toString());
        let year = parseInt(this.year.val().toString());
        if (this.sliderHeader === 'start') {
            this.slider.setSliderChanger({
                from: PersianFormat.dateToTS(year, month, day)
            })
        } else if (this.sliderHeader === 'end') {
            this.slider.setSliderChanger({
                to: PersianFormat.dateToTS(year, month, day)
            })
        } else {
            this.elem.val([(PersianFormat.fixNumbers(day.toString(), 1)), PersianFormat._jalali_months[month], PersianFormat.fixNumbers(year.toString(), 1)].join(' '))
        }
    }

    createCalendar() {
        let _self = this;
        this.elem.on('click', () => {
            this.showCalendar()
        })
        this.month.on('change', () => {
            this.setMonthYear();
        });
        this.year.on('change', () => {
            this.setMonthYear()
        });
        this.prev.on('click', () => {
            this.nextPrev();
        });
        this.next.on('click', () => {
            this.nextPrev(1);
        });
        this.today.on('click', function () {
            _self.setToday();
        })
        this.setTableRows();
        this.holder.find('td').on('click', function () {
            let day = parseInt($(this).attr('data-date'));
            _self.tbody.find('td.selected-day').removeClass('selected-day')
            _self.updateSlider(day);
            _self.selectedDay();
        });
    }

    constructor(option: object) {
        let _self = this
        this.sliderHeader = option['header'];
        this.slider = option['slider'];
        this.elem = $(`#${option['id']}`);
        let initialDate: string = [PersianFormat._jalali_months[option['initial_date'][1]], PersianFormat.fixNumbers(option['initial_date'][0].toString(), 1), PersianFormat.fixNumbers(option['initial_date'][2].toString(), 1)].join(' ')
        let initialDateArray: string[] = initialDate.split(' ');
        initialDate = [initialDateArray[2], initialDateArray[0], initialDateArray[1]].join(' ');
        this.elem
            .addClass('date-input')
            .attr('value', initialDate)
            .prop('readonly', true)
            .wrap('<div class="date-input-holder"></div>');
        this.holder = this.elem.parent();
        this.addCalendarParts();
        this.elem.on('click', () => {
            _self.updateTable();
            this.elem.parent().find('.calendar').css('visibility', 'visible');
        })
        $("html").on('click', function (e) {
            if ($(e.target).closest(_self.holder).length === 0) {
                if ((_self.holder.find('.calendar').css('visibility')) == 'visible') {
                    _self.holder.find('.calendar').css('visibility', 'hidden')
                        .find('tbody td').css('visibility', 'hidden');
                }
            }
        });

        this.fromTo = [option['from'], option['to']]
        this.createCalendar();
        this.addMonthYearData();
    }
}

class PBReport {
    constructor(option: object) {
        $(`#${option['main']}`).append('<br><br><br><input id="inp"><br><div class="date-input-holder"><input id="start"/><br><p></p><input id="end"/></div><br><br><table id="table"></table>');
        let slider = new Slider({
            input: 'inp',
            range: [PersianFormat.dateToTS(option['from'][0], option['from'][1] - 1, option['from'][2]), PersianFormat.dateToTS(option['to'][0], option['to'][1] - 1, option['to'][2] + 1)],
            initialValues: [PersianFormat.dateToTS(option['initial_from'][0], option['initial_from'][1] - 1, option['initial_from'][2] + 1), PersianFormat.dateToTS(option['initial_to'][0], option['initial_to'][1] - 1, option['initial_to'][2] + 1)],
            prettify: function (x, y) {
                return [PersianFormat.tsToDate(x), PersianFormat.tsToDate(y)];
            },
            onChange: function (x, y) {
                $("#start").attr('value', PersianFormat.tsToDate(x));
                $("#end").attr('value', PersianFormat.tsToDate(y));
            },
        });
        option['initial_from'][1] -= 1;

        new Calendar({
            id: 'start',
            initial_date: option['initial_from'],
            from: option['from'][0],
            to: option['to'][0],
            slider: slider,
            header: 'start'
        });
        option['initial_to'][1] -= 1;
        new Calendar({
            id: 'end',
            initial_date: option['initial_to'],
            from: option['from'][0],
            to: option['to'][0],
            slider: slider,
            header: 'end'
        });
    }
}


export interface IBasicFilter extends IFilter {
    operator: BasicFilterOperators;
    values: (string | number | boolean)[];
}

interface IAdvancedFilterCondition {
    value: (string | number | boolean);
    operator: AdvancedFilterConditionOperators;
}

export class Visual implements IVisual {
    public name: string;
    public type: string;
    public title: string;
    private target: HTMLElement;
    private updateCount: number;
    private visualHost: IVisualHost;
    private settings: VisualSettings;
    private first_state: boolean = true;
    private dateIndex: number = 100000;
    private options: VisualUpdateOptions;
    private individualData = [];
    private rowData = [];
    private canEmpty = false;
    private tablo: Tablo;

    constructor(options: VisualConstructorOptions) {
        this.target = options.element;
        this.visualHost = options.host;
        this.updateCount = 0;
        if (document) {
            const main: HTMLElement = document.createElement("div");
            main.setAttribute('id', 'main')
            this.target.appendChild(main);
        }
    }

    public updateTable() {

    }

    public update(options: VisualUpdateOptions) {
        // this.settings = Visual.parseSettings(options && options.dataViews && options.dataViews[0]);
        // this.options = options;
        // let cate = this.options.dataViews[0].categorical.categories;
        // for (let u = 0; u < cate.length; u++) {
        //     if (cate[u].values[0].toString().split('/').length === 3) {
        //         this.dateIndex = u;
        //         break;
        //     }
        // }
        // if (cate.length >= this.dateIndex + 1) {
        //     if (this.first_state) {
        //         let vals = (cate[this.dateIndex].values.map(function (x) {
        //             return x.toString();
        //         }));
        //         let removeNonDates = (arr) => {
        //             let indexes = []
        //             arr.forEach(function (v, i) {
        //                 if (v.split('/').length !== 3)
        //                     indexes.push(i);
        //             })
        //             for (let i of indexes) {
        //                 arr.splice(i, 1);
        //             }
        //             return arr;
        //         }
        //         vals = removeNonDates(vals)
        //         let minMax = PersianFormat.setDatesStringStandardArrays(PersianFormat.getMinMaxDates(vals))
        //         new PBReport({
        //             main: "main",
        //             from: minMax[0],
        //             to: minMax[1],
        //             initial_from: minMax[0],
        //             initial_to: minMax[1],
        //         });
        //         this.tablo = new Tablo({
        //             table: 'table',
        //             lang: 'fa',
        //             row_num: false,
        //             tableHeaders: {
        //                 'مشتری': Tablo.dataTypes['str'],
        //                 'محصول': Tablo.dataTypes['str'],
        //                 'تاریخ': Tablo.dataTypes['dte'],
        //             },
        //             pack_size: 5,
        //         });
        //         this.first_state = false;
        //     }
        //     // $('.table-container').remove();
        //     // $('#main').append('<table id="table"></table>');
        //     // tablo = new Tablo({
        //     //     table: 'table',
        //     //     lang: 'fa',
        //     //     row_num: false,
        //     //     tableHeaders: {
        //     //         'مشتری': Tablo.dataTypes['str'],
        //     //         'محصول': Tablo.dataTypes['str'],
        //     //         'تاریخ': Tablo.dataTypes['dte'],
        //     //     },
        //     //     pack_size: 5,
        //     // });
        //     this.tablo.empty();
        //     let from = PersianFormat.getTimestampFromInput($('#start').val())
        //     let to = PersianFormat.getTimestampFromInput($('#end').val())
        //     for (let i = 0; i < cate[0].values.length; i++)
        //         if (from <= PersianFormat.getTimestampFromStandardPersian(cate[this.dateIndex].values[i].toString()) && to >= PersianFormat.getTimestampFromStandardPersian(cate[this.dateIndex].values[i].toString())) {
        //             for (let j = 0; j < cate.length; j++) {
        //                 this.individualData.push(cate[j].values[i].toString())
        //             }
        //             this.rowData.push(this.individualData);
        //             this.individualData = [];
        //         }
        //     this.tablo.addDatas(this.rowData);
        //     this.canEmpty = true;
        //     this.rowData = [];
        // } else
        //     return;
        // options.

        // let categories: DataViewCategoricalColumn = options.dataViews[0].categorical.categories[0];
        // let categories: DataViewCategoricalColumn = this.dataView.categorical.categories[0];
        let target: IFilterColumnTarget = interactivityFilterService.extractFilterColumnTarget(options.dataViews[0].metadata.columns[0]);
        let conditions: IAdvancedFilterCondition[] = [];
        conditions.push({
            operator: "GreaterThan",
            value: 3
        });
        let filter: IAdvancedFilter = {
            $schema: "http://powerbi.com/product/schema#advanced",
            ...(new AdvancedFilter(target, "And", conditions))
        }
        console.log(125)
        this.visualHost.applyJsonFilter(filter, "general", "filter", FilterAction.merge);
        $('#main').text(555)
    }

    private static parseSettings(dataView: DataView): VisualSettings {
        return <VisualSettings>VisualSettings.parse(dataView);
    }

    public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {
        return VisualSettings.enumerateObjectInstances(this.settings || VisualSettings.getDefault(), options);
    }
}

