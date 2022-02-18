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
            },
            { command: [{
                    text: "Удалить",
                    title: "",
                    attributes: { style: "text-align: center;" },
                    click: function(e) {
                        e.preventDefault();
                        /*if (!confirm("Вы действительно хотите удалить эту запись?"))
                            return;*/
                        let tr = $(e.target).closest("tr");
                        let data = this.dataItem(tr);
                        if (data.id != null)
                            (async () => {
                                let res = await MongoApi.deleteHotelRoom(data.id);
                                if (typeof(res) == 'string') {
                                    showApiNotification('Не удалось удалить запись', 'Удаление', notificationEnum.error);
                                    return;
                                }
                                await loadGrid();
                            })()
                        else {
                            let grid = $("#hostel-room-list").data("kendoGrid");
                            grid.removeRow(tr);
                        }
                    }
                }],
                width: 100
            }
        ],
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
                await loadGrid();
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

    await loadGrid();

    async function loadGrid() {
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
}