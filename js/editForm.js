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

    let grid = $("#hostel-room-list").kendoGrid({
        width: "100%",
        pageable: {
            pageSizes: [25, 50, 100, 250, 500, 1000, 2000, "all"]
        },
        sortable: true,
        scrollable: false,
        filterable: true,
        editable: true,
        schema: {
            model: {
                id: "id",
                fields: {
                    "number": { type: "number", editable: true, validation: {  min: 0 } },
                    "seats": { type: "number", editable: true, validation: { min: 0 } },
                    "cost": { type: "decimal", editable: true, validation: {  min: 0 } },
                    "comfortLevel": { editable: false }
                }
            }
        },
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
                    attributes: {
                        style: "text-align: center;"
                    },
                    click: async function(e) {
                        e.preventDefault();
                        if (!confirm("Вы действительно хотите удалить эту запись?"))
                            return;
                        let tr = $(e.target).closest("tr");
                        let data = this.dataItem(tr);
                        await MongoApi.deleteHotelRoom(data.id);
                        let grid = $("#hostel-room-list").data("kendoGrid");
                        grid.removeRow(tr);
                    }
                }]
            }
        ],
        saveChanges: function(e) {
            let grid = $("#hostel-room-list").data("kendoGrid");
            let currentData = grid.dataSource.data();
            for (let i = 0; i < currentData.length; i++) {
                if(currentData[i].dirty) {
                    console.log(currentData[i].id);
                }
            }
        },
        dataBound: function(e) {
            let grid = e.sender;
            let items = e.sender.items();

            items.each(function(e) {
                let dataItem = grid.dataItem(this);
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

                        dataItem.set("comfortLevel", e.sender.value());
                    }
                });
            });
        }
    }).data("kendoGrid");

    let dataGrid = await MongoApi.getHotelRooms();
    if (dataGrid === undefined)
        return;

    grid.setDataSource(new kendo.data.DataSource({
        data: dataGrid,
        pageSize: 25,
        batch: true
    }));
}