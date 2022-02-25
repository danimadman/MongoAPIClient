async function loadEditForm(containerName, editFormName) {
    switch (editFormName) {
        case Object.keys(editFormEnum)[0]:
            await HostelService.loadTemplate(containerName);
            break;
        case Object.keys(editFormEnum)[1]:
            await ClientsService.loadTemplate(containerName);
            break;
        case Object.keys(editFormEnum)[2]:
            await RecordsService.loadTemplate(containerName);
            break;
        default:
            loatTemplateMongo(containerName);
            break;
    }
}

var HostelService = {
    loadTemplate: async function(containerName) {
        let formType = editFormEnum["hostel-room"];

        if (formType == undefined) {
            showApiNotification("Не удалось открыть форму редактирования", "Ошибка", notificationEnum.error);
            return;
        }

        let template = kendo.template($(`#${formType.templateName}`).html());

        if (template == undefined) {
            showApiNotification("Не удалось найти шаблон формы редактирования", "Ошибка", notificationEnum.error);
            return;
        }

        $(`#${containerName}`).html(template);
        $(`#${containerName}`).show();

        $("#hostel-room-list").kendoGrid({
            width: "100%",
            pageable: {
                pageSizes: [25, 50, 100, 250, 500, 1000, 2000, "all"]
            },
            sortable: true,
            scrollable: false,
            filterable: true,
            editable: true,
            groupable: true,
            toolbar: ["create", "save", "cancel"],
            columns: [{
                field: "number",
                title: "№ отеля",
                filterable: {
                    cell: {
                        operator: "contains",
                        suggestionOperator: "contains"
                    }
                },
                attributes: { style: "text-align: center;" },
            }, {
                field: "seats",
                title: "Количество мест",
                filterable: true,
                sortable: true,
                attributes: { style: "text-align: center;" }
            }, {
                field: "comfortLevel",
                title: "Уровень комфорта",
                filterable: true,
                sortable: true,
                attributes: { style: "text-align: center;" },
                editable: function () { return false; },
                template: '<select class="comfort-level-list"/>'
            }, {
                field: "cost",
                title: "Цена за номер",
                filterable: true,
                sortable: true,
                attributes: { style: "text-align: center;" }
            }, {
                command: [{
                    text: "Удалить",
                    title: "",
                    attributes: { style: "text-align: center;" },
                    click: function(e) {
                        e.preventDefault();
                        let tr = $(e.target).closest("tr");
                        let data = this.dataItem(tr);
                        if (data.id != null) {
                            if (!confirm("Вы действительно хотите удалить эту запись?"))
                                return;
                            (async () => {
                                let res = await MongoApi.deleteHotelRoom(data.id);
                                if (typeof(res) == 'string') {
                                    showApiNotification('Не удалось удалить запись', 'Удаление', notificationEnum.error);
                                    return;
                                }
                                await HostelService.loadGrid();
                            })();
                        }
                        else {
                            let grid = $("#hostel-room-list").data("kendoGrid");
                            grid.removeRow(tr);
                        }
                    }
                }],
                width: 100
            }],
            saveChanges: function(e) {
                let grid = $("#hostel-room-list").data("kendoGrid");
                let currentData = grid.dataSource.data();
                (async () => {
                    for (let i = 0; i < currentData.length; i++) {
                        if(currentData[i].dirty) {
                            let res = currentData[i].id === null
                                ? await MongoApi.postHotelRoom(currentData[i])
                                : await MongoApi.putHotelRoom(currentData[i]);
                            if (typeof(res) == 'string') {
                                showApiNotification(res, 'Сохранение', notificationEnum.error);
                            }
                        }
                    }
                    await HostelService.loadGrid();
                })();
            },
            dataBound: function(e) {
                let grid = e.sender;
                let items = e.sender.items();

                items.each(function(e) {
                    let dataItem = grid.dataItem(this);

                    if (dataItem.comfortLevel == 0)
                        dataItem.comfortLevel = dictComfortLevel.Usual;

                    let ddt = $(this).find(".comfort-level-list");
                    $(ddt).kendoDropDownList({
                        value: dataItem.comfortLevel,
                        dataSource: comfortLevelList,
                        dataTextField: "name",
                        dataValueField: "id",
                        change: function(e) {
                            let element = e.sender.element;
                            let row = element.closest("tr");
                            let grid = $("#hostel-room-list").data("kendoGrid");
                            let dataItem = grid.dataItem(row);

                            dataItem.comfortLevel = e.sender.value();
                            //dataItem.set("comfortLevel", e.sender.value());
                        }
                    });
                });
            }
        }).data("kendoGrid");

        await this.loadGrid();
    },
    loadGrid:async function() {
        let dataGrid = await MongoApi.getHotelRooms();
        if (dataGrid === undefined)
            return;

        $("#hostel-room-list").data("kendoGrid").setDataSource(new kendo.data.DataSource({
            data: dataGrid,
            pageSize: 25,
            batch: true,
            schema: {
                model: {
                    id: "id",
                    fields: {
                        id: { editable: false, nullable: true },
                        number: { type: "number", editable: true, validation: { required: { message: "Обязательно к заполнению" }, min: 0 } },
                        seats: { type: "number", editable: true, validation: { required: { message: "Обязательно к заполнению" }, min: 0 } },
                        cost: { type: "number", editable: true, validation: { required: { message: "Обязательно к заполнению" }, min: 0 }, format: "{0:c}" },
                        comfortLevel: { type: "number", editable: false, validation: { required: { message: "Обязательно к заполнению" }, min: 1 } }
                    }
                }
            }
        }));
    }
};

var ClientsService = {
    loadTemplate: async function(containerName) {
        let formType = editFormEnum.clients;

        if (formType == undefined) {
            showApiNotification("Не удалось открыть форму редактирования", "Ошибка", notificationEnum.error);
            return;
        }

        let template = kendo.template($(`#${formType.templateName}`).html());

        if (template == undefined) {
            showApiNotification("Не удалось найти шаблон формы редактирования", "Ошибка", notificationEnum.error);
            return;
        }

        $(`#${containerName}`).html(template);
        $(`#${containerName}`).show();

        $("#clients-list").kendoGrid({
            width: "100%",
            pageable: {
                pageSizes: [25, 50, 100, 250, 500, 1000, 2000, "all"]
            },
            sortable: true,
            scrollable: true,
            filterable: true,
            editable: false,
            columns: [{
                field: "firstName",
                title: "Имя",
                filterable: {
                    cell: {
                        operator: "contains",
                        suggestionOperator: "contains"
                    }
                },
                attributes: { style: "text-align: center;" },
            }, {
                field: "middleName",
                title: "Отчество",
                filterable: {
                    cell: {
                        operator: "contains",
                        suggestionOperator: "contains"
                    }
                },
                sortable: true,
                attributes: { style: "text-align: center;" }
            }, {
                field: "lastName",
                title: "Фамилия",
                filterable: {
                    cell: {
                        operator: "contains",
                        suggestionOperator: "contains"
                    }
                },
                sortable: true,
                attributes: { style: "text-align: center;" }
            }, {
                field: "birthDay",
                title: "Дата рождения",
                format: "{0: dd.MM.yyyy г.}",
                filterable: {
                    cell: {
                        operator: "contains",
                        suggestionOperator: "contains"
                    }
                },
                sortable: true,
                attributes: { style: "text-align: center;" }
            }, {
                command: {
                    text: "Детали",
                    title: "",
                    attributes: { style: "text-align: center;" },
                    click: function(e) {
                        e.preventDefault();
                        let tr = $(e.target).closest("tr");
                        let data = this.dataItem(tr);
                        (async () => { await ClientsService.openDetails(data.id); })();
                    }
                },
                width: 95
            }, {
                command: {
                    text: "Удалить",
                    title: "",
                    attributes: {style: "text-align: center;"},
                    click: function (e) {
                        e.preventDefault();
                        if (!confirm("Вы действительно хотите удалить эту запись?"))
                            return;
                        let tr = $(e.target).closest("tr");
                        let data = this.dataItem(tr);
                        if (data.id != null)
                            (async () => {
                                let res = await MongoApi.deleteClient(data.id);
                                if (typeof (res) == 'string') {
                                    showApiNotification(res, 'Удаление', notificationEnum.error);
                                    return;
                                }
                                await ClientsService.loadGrid();
                            })();
                        else {
                            let grid = $("#clients-list").data("kendoGrid");
                            grid.removeRow(tr);
                        }
                    }
                },
                width: 101
            }]
        }).data("kendoGrid");

        $('[data-role="open-client-add"]').click(async function () {
            await ClientsService.openDetails(null);
        });

        await this.loadGrid();
    },
    loadGrid: async function() {
        let dataGrid = await MongoApi.getClients();
        if (dataGrid === undefined)
            return;

        $("#clients-list").data("kendoGrid").setDataSource(new kendo.data.DataSource({
            data: dataGrid,
            pageSize: 25,
            schema: {
                model: {
                    id: "id",
                    fields: {
                        id: { editable: false, nullable: true },
                        birthDay: { type: "date", nullable: true },
                    }
                }
            }
        }));
    },
    openDetails: async function (id) {
        let data = id != null ? await MongoApi.getClient(id) : {
            id: null,
            lastName: null,
            firstName: null,
            middleName: null,
            birthDay: null,
            comment: null,
            passport: {
                series: null,
                number: null,
                issued: null,
                dateIssued: null,
                divisionCode: null
            }
        };
        let tmpl = kendo.template($("#client-details-template").html());
        wnd.content(tmpl(data));
        $('[control-type="text-box"]').kendoTextBox();
        $('[control-type="date-picker"]').kendoDatePicker();
        $('[control-type="text-area"]').kendoTextArea({
            maxLength: 1000,
            heigth: "100%",
            rows: 5
        });
        $('[data-role="save-client"]').click(async function () {
            let formData = new FormData();

            $('[data-role="property"]').each(function () {
                let propertyName = $(this).data("property-name");
                let propertyValue = $(this).val();
                formData.append(propertyName, propertyValue);
            });

            let res = formData.get("Id") == null || formData.get("Id") == ''
                ? await MongoApi.postClient(formData)
                : await MongoApi.putClient(formData);

            if (typeof (res) == 'string' && res != "") {
                showApiNotification(res, 'Сохранение', notificationEnum.error);
                return;
            }
            wnd.close();
            await ClientsService.loadGrid();
        });
        $('[data-role="cancel-client"]').click(function () {
            wnd.close();
        });
        wnd.center().open();
    }
};

var RecordsService = {
    loadTemplate: async function(containerName) {
        let formType = editFormEnum.records;

        if (formType == undefined) {
            showApiNotification("Не удалось открыть форму редактирования", "Ошибка", notificationEnum.error);
            return;
        }

        let template = kendo.template($(`#${formType.templateName}`).html());

        if (template == undefined) {
            showApiNotification("Не удалось найти шаблон формы редактирования", "Ошибка", notificationEnum.error);
            return;
        }

        $(`#${containerName}`).html(template);
        $(`#${containerName}`).show();

        $("#records-list").kendoGrid({
            width: "100%",
            pageable: {
                pageSizes: [25, 50, 100, 250, 500, 1000, 2000, "all"]
            },
            sortable: true,
            scrollable: true,
            filterable: true,
            groupable: true,
            editable: false,
            columns: [{
                field: "personName",
                title: "ФИО клиента",
                filterable: {
                    cell: {
                        operator: "contains",
                        suggestionOperator: "contains"
                    }
                },
                attributes: { style: "text-align: center;" },
            }, {
                field: "hotelRoomName",
                title: "Номер отеля",
                filterable: {
                    cell: {
                        operator: "contains",
                        suggestionOperator: "contains"
                    }
                },
                attributes: { style: "text-align: center;" },
            }, {
                field: "settlementDate",
                title: "Дата заселения",
                format: "{0: dd.MM.yyyy HH:mm}",
                filterable: {
                    cell: {
                        operator: "contains",
                        suggestionOperator: "contains"
                    }
                },
                sortable: true,
                attributes: { style: "text-align: center;" }
            }, {
                field: "releaseDate",
                title: "Дата освобождения",
                format: "{0: dd.MM.yyyy HH:mm}",
                filterable: {
                    cell: {
                        operator: "contains",
                        suggestionOperator: "contains"
                    }
                },
                sortable: true,
                attributes: { style: "text-align: center;" }
            }, {
                command: {
                    text: "Детали",
                    title: "",
                    attributes: { style: "text-align: center;" },
                    click: function(e) {
                        e.preventDefault();
                        let tr = $(e.target).closest("tr");
                        let data = this.dataItem(tr);
                        (async () => {
                            await RecordsService.openDetails(data.id);
                        })();
                    }
                },
                width: 95
            }, {
                command: {
                    text: "Удалить",
                    title: "",
                    attributes: {style: "text-align: center;"},
                    click: function (e) {
                        e.preventDefault();
                        if (!confirm("Вы действительно хотите удалить эту запись?"))
                            return;
                        let tr = $(e.target).closest("tr");
                        let data = this.dataItem(tr);
                        if (data.id != null)
                            (async () => {
                                let res = await MongoApi.deleteRecord(data.id);
                                if (typeof (res) == 'string') {
                                    showApiNotification(res, 'Удаление', notificationEnum.error);
                                    return;
                                }
                                await RecordsService.loadGrid();
                            })()
                        else {
                            let grid = $("#records-list").data("kendoGrid");
                            grid.removeRow(tr);
                        }
                    }
                },
                width: 101
            }]
        }).data("kendoGrid");

        $('[data-role="records-add"]').click(async function () {
            await RecordsService.openDetails(null);
        });

        await this.loadGrid();
    },
    loadGrid: async function() {
        let dataGrid = await MongoApi.getRecords();
        if (dataGrid === undefined)
            return;

        $("#records-list").data("kendoGrid").setDataSource(new kendo.data.DataSource({
            data: dataGrid,
            pageSize: 25,
            schema: {
                model: {
                    id: "id",
                    fields: {
                        id: { editable: false, nullable: true },
                        settlementDate: { type: "date", nullable: true },
                        releaseDate: { type: "date", nullable: true }
                    }
                }
            }
        }));
    },
    openDetails: async function (id) {
        let data = id != null ? await MongoApi.getRecord(id) : {
            id: null,
            personId: null,
            hotelRoomId: null,
            settlementDate: null,
            releaseDate: null,
            note: null
        };
        if (typeof (data) == 'string') {
            showApiNotification(data, 'Получение деталей записи', notificationEnum.error);
            return;
        }
        let tmpl = kendo.template($("#record-details-template").html());
        wnd.content(tmpl(data));

        $('[control-type="datetimepicker"]').kendoDateTimePicker();
        $('[control-type="textarea"]').kendoTextArea({
            maxLength: 1000,
            rows: 5
        });
        let dataGrid = await MongoApi.getClients();
        $('[data-property-name="PersonId"]').kendoComboBox({
            filter:"startswith",
            dataTextField: 'personFIO',
            dataValueField: "id",
            value: data.personId,
            template: '#:lastName# #:firstName# #:middleName#<br/>' +
                'Дата рождения: #:kendo.toString(kendo.parseDate(birthDay), "dd.MM.yyyy г.")#',
            dataSource: dataGrid
        });

        dataGrid = await MongoApi.getHotelRooms();
        $('[data-property-name="HotelRoomId"]').kendoComboBox({
            filter:"startswith",
            dataTextField: "number",
            dataValueField: "id",
            value: data.hotelRoomId,
            template: 'Номер отеля: #:number#<br/>Количество свободных мест: #:seats#' +
                '<br/>Цена: #:cost#<br/>Урвоень комфорта: #:getComfortLevelName(comfortLevel)#',
            dataSource: dataGrid
        });

        $('[data-role="save-client"]').click(async function () {
            let formData = new FormData();

            $('[data-role="property"]').each(function () {
                let propertyName = $(this).data("property-name");
                let propertyValue = $(this).val();
                formData.append(propertyName, propertyValue);
            });

            let res = formData.get("Id") == null || formData.get("Id") == ''
                ? await MongoApi.postRecord(formData)
                : await MongoApi.putRecord(formData);

            if (typeof (res) == 'string' && res != "") {
                showApiNotification(res, 'Сохранение', notificationEnum.error);
                return;
            }
            wnd.close();
            await RecordsService.loadGrid();
        });
        $('[data-role="cancel-client"]').click(function () {
            wnd.close();
        });
        wnd.center().open();
    }
};

function getComfortLevelName(id) {
    return comfortLevelList?.find(x => x.id == id)?.name ?? "";
}

var connString = "mongodb://localhost:27017";

function loatTemplateMongo(containerName) {
    let template = kendo.template($(`#create-db-template`).html());

    $(`#${containerName}`).html(template);
    $(`#${containerName}`).show();

    $('[control-type="textbox"]').kendoTextBox();

    $('#connectionString').click(function () {
        connString = $(this).val();
        (async () => {
            let db = await MongoApi.getDatabases();
            $('#database').setDataSource(new kendo.data.DataSource({
                data: db
            }));
            $('#collections').setDataSource(new kendo.data.DataSource({
                data: []
            }));
        })();
    });

    (async () => {
        let db = await MongoApi.getDatabases();
        $('#database').kendoComboBox({
            filter:"startswith",
            dataTextField: 'name',
            dataValueField: "name",
            dataSource: db,
            select: function(e) {
                (async () => {
                    let collections = await MongoApi.getDatabases($('#database').val());
                    $('#collections').setDataSource(new kendo.data.DataSource({
                        data: collections
                    }));
                })();
            }
        });
        let collections = $('#database').val() != ""
            ? await MongoApi.getCollections($('#database').val()) : [];
        $('#collections').kendoComboBox({
            filter:"startswith",
            dataTextField: 'name',
            dataValueField: "name",
            dataSource: collections
        });
    })();

    $('[control-type="text-area"]').kendoTextArea({
        maxLength: 1000,
        heigth: "100%",
        rows: 5
    });
}