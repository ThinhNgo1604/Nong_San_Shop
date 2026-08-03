import { useEffect, useState } from "react";

function CategoryForm({
    onAdd,
    onUpdate,
    editingCategory
}) {

    const [tenDM, setTenDM] = useState("");

    const [moTa, setMoTa] = useState("");

    const [errors, setErrors] = useState({});

    const handleSubmit = (e) => {

        e.preventDefault();
        if (!validate()) return;
        const data = {
            TenDM: tenDM,
            MoTa: moTa
        };

        if (editingCategory) {

            onUpdate(editingCategory.MaDM, data);

        } else {

            onAdd(data);

        }

        setTenDM("");
        setMoTa("");

    };
    useEffect(() => {

        if (editingCategory) {

            setTenDM(editingCategory.TenDM);
            setMoTa(editingCategory.MoTa);

        }else {

        setTenDM("");
        setMoTa("");

    }

    }, [editingCategory]);

const validate = () => {

    let err = {};

    if (!tenDM.trim()) {
        err.tenDM = "Tên danh mục không được để trống.";
    } else if (tenDM.trim().length < 2) {
        err.tenDM = "Tên danh mục phải có ít nhất 2 ký tự.";
    } else if (tenDM.trim().length > 100) {
        err.tenDM = "Tên danh mục tối đa 100 ký tự.";
    }

    if (moTa.length > 255) {
        err.moTa = "Mô tả tối đa 255 ký tự.";
    }

    setErrors(err);

    return Object.keys(err).length === 0;
};
    return (

        <div className="card mb-4">

            <div className="card-body">

                <h4>Thêm danh mục</h4>

                <form onSubmit={handleSubmit}>

                    <input
                        className={`form-control mb-1 ${
                            errors.tenDM ? "is-invalid" : ""
                        }`}
                        placeholder="Tên danh mục"
                        value={tenDM}
                        onChange={(e) => setTenDM(e.target.value)}
                    />

                    <div className="invalid-feedback d-block">
                        {errors.tenDM}
                    </div>

                    <textarea
                        className={`form-control mb-1 ${
                            errors.moTa ? "is-invalid" : ""
                        }`}
                        placeholder="Mô tả"
                        value={moTa}
                        onChange={(e) => setMoTa(e.target.value)}
                    />

                    <div className="invalid-feedback d-block">
                        {errors.moTa}
                    </div>

                    <button className="btn btn-success">

                        {
                            editingCategory
                                ? "Cập nhật"
                                : "Thêm danh mục"
                        }

                    </button>

                </form>

            </div>

        </div>

    );

}

export default CategoryForm;