async function loadEditForm(editFormName) {
    let formType = editFormEnum[editFormName];

    if (formType == undefined) {
        showApiNotification("Не удалось открыть форму редактирования", "Ошибка", notificationEnum.error);
        return;
    }

    let template = kendo.template($(`#${formType.templateName}`).html());

    if (template == undefined) {
        showApiNotification("Не удалось найти шаблон формы редактирования", "Ошибка", notificationEnum.error);
        return;
    }

    $("#edit-form").html(template);
    $("#edit-form").show();

    switch (editFormName) {
        case Object.keys(editFormEnum)[0]:
            await templateHostel();
            break;
        case Object.keys(editFormEnum)[1]:
            await templateClients();
            $('[data-role="open-client-add"]').click(function () {
                openClientDetails({
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
                });
            });
            break;
        case Object.keys(editFormEnum)[2]:
            break;
    }
}

async function templateHostel() {
    let comfortLevelList = await MongoApi.getDictComfortLevel();

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
                            await loadHostelGrid();
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
                await loadHostelGrid();
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

    await loadHostelGrid();
}

async function templateClients() {
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
            format: "{0: dd MMMM yyyy год}",
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
                    openClientDetails(data);
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
                            await loadClientsGrid();
                        })()
                    else {
                        let grid = $("#clients-list").data("kendoGrid");
                        grid.removeRow(tr);
                    }
                }
            },
            width: 101
        }]
    }).data("kendoGrid");

    await loadClientsGrid();
}

async function loadHostelGrid() {
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

async function loadClientsGrid() {
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
}

function openClientDetails(data) {
    let tmplClientDetails = kendo.template($("#client-details-template").html());
    wnd.content(tmplClientDetails(data));
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

        let res = formData.get("id") == null
            ? await MongoApi.postClient(formData)
            : await MongoApi.putClient(formData);

        if (typeof (res) == 'string' && res != "") {
            showApiNotification(res, 'Сохранение', notificationEnum.error);
            return;
        }
        wnd.close();
        await loadClientsGrid();
    });
    $('[data-role="cancel-client"]').click(function () {
        wnd.close();
    });
    wnd.center().open();
}