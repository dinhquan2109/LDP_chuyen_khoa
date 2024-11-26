
let currentPage = 1; // Trang hiện tại
const itemsPerPage = 5; // Số phần tử mỗi trang

//Khi ấn started
function scrollToForm() {
    $('html, body').animate({
        scrollTop: $("#contentForm").offset().top
    }, 500); // 1000ms = 1 giây
}
//Khi ấn Xác nhận
function scrollToTable() {
    $('html, body').animate({
        scrollTop: $("#contentTable").offset().top
    }, 1000); // 1000ms = 1 giây
}


const apiToken = "IQaMyOWPp6WOPp0ro0faXHcqS1g7BmRKseZwicxX";

const pageSize = 100;
let studentsList = [];

async function updateStudentData(data) {
    const updateUrl = `https://noco-erp.com/api/v2/tables/mvkojuqincudlmi/records`;
    const response = await fetch(updateUrl, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'xc-token': apiToken
        },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        const errorMsg = await response.text();
        throw new Error(`Error updating student: ${response.status} ${response.statusText} - ${errorMsg}`);
    }

    const result = await response.json();
    return result;

}

async function fetchData() {
    const urlParams = new URLSearchParams(window.location.search);
    const studentId = urlParams.get('id')
    if (studentId) {
        const baseUrl = `https://noco-erp.com/api/v2/tables/mvkojuqincudlmi/records?viewId=vwgu6zsjwdjp7ovz&where=(studentId,eq,${studentId})`;

        const checkResponse = await fetch(baseUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'xc-token': apiToken
            }
        });

        if (!checkResponse.ok) {
            console.error(`Error checking studentId: ${checkResponse.status} ${checkResponse.statusText}`);
            return [];
        }

        const checkData = await checkResponse.json();

        if (checkData.list.length > 0) {
            fillForm(checkData.list[0]);
            return checkData.list;
        }
    }

    return []; // Trả về toàn bộ dữ liệu học viên nếu không có điều kiện lọc
}


// Hàm để điền dữ liệu vào form
function fillForm(student) {
    if (student) {
        document.getElementById('Id').value = student.Id || ''; // Điền ID
        document.getElementById('maHV').value = student.maHV || '';
        document.getElementById('maLop').value = student.maLop || '';
        document.getElementById('hoTenHocVien').value = student.hoTenHocVien || '';
        document.getElementById('sdtHocVien').value = student.sdtHocVien || '';
        document.getElementById('emailHocVien').value = student.emailHocVien || '';
        document.getElementById('tenSanPham').value = student.tenSanPham || '';
        document.getElementById('trinhDo').value = student.trinhDo || '';
        document.getElementById('size').value = student.size || '';
        document.getElementById('loaiGiaoVien').value = student.loaiGiaoVien || '';
        document.getElementById('soBuoi').value = student.soBuoi || '';
        document.getElementById('lichHocMoi').value = student.lichHocMoi || '';
        document.getElementById('maLopMoi').value = student.maLopMoi || '';
        document.getElementById('ngayKhaiGiangMoi').value = student.ngayKhaiGiangMoi || '';
        document.getElementById('status').value = student.status || '';
        document.getElementById('trinhDoMoi').value = student.trinhDoMoi || '';
        
    }
}

fetchData();

// Kiểm tra dữ liệu và hiển thị hộp thoại xác nhận bằng SweetAlert2 khi nhấn nút "Xác nhận thông tin"
document.getElementById('confirmBtn').addEventListener('click', async function () {
    const classCode = document.getElementById('maLopMoi').value.trim();
    const lichHoc = document.getElementById('lichHocMoi').value.trim();
    const startDate = document.getElementById('ngayKhaiGiangMoi').value.trim();
    const status = 'HV. Xác nhận lịch có sẵn';
    const trinhDoMoi =document.getElementById('trinhDoMoi').value.trim();

    if (!classCode || !lichHoc || !startDate) {
        Swal.fire({
            icon: 'error',
            title: 'Lỗi',
            text: 'Bạn chưa được xếp lịch học, xin mời click vào "chọn lịch khác".'
        });
        return;
    }

    // Hiển thị hộp thoại xác nhận trước khi thực hiện
    const confirmResult = await Swal.fire({
        title: 'Xác nhận thông tin',
        text: `Bạn có chắc chắn xác nhận vào lớp học với mã lớp "${classCode}" và lịch học "${lichHoc}" không?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Xác nhận',
        cancelButtonText: 'Hủy'
    });

    if (!confirmResult.isConfirmed) {
        return; // Nếu người dùng nhấn "Hủy," dừng thực hiện.
    }

    try {
        // Tìm lớp học hiện tại theo mã lớp
        const lopHocData = (await timLopHoc(classCode)).list;

        if (lopHocData && lopHocData.length > 0) {
            for (const record of lopHocData) {
                const soDaDangKyHienTai = record.soDaDangKy || 0;
                const soSlotConLai = record.soSlotConLai || 0;

                if (soSlotConLai <= 0) {
                    Swal.fire('Lớp học đã đủ sĩ số, vui lòng chọn lớp khác.', '', 'warning');
                    fetchAndCompareData();
                    return;
                }

                const updatedLopHocData = {
                    Id: record.Id,
                    soDaDangKy: soDaDangKyHienTai + 1,
                };

                await updateLopHoc(updatedLopHocData);
            }

            // Chuẩn bị dữ liệu học viên
            const updatedData = {
                Id: document.getElementById('Id').value.trim(),
                maLopMoi: classCode,
                lichHocMoi: lichHoc,
                ngayKhaiGiangMoi: startDate,
                trinhDoMoi: trinhDoMoi,
                status: status
            };

            // Cập nhật thông tin học viên
            await updateStudentData(updatedData);

            // Hiển thị thông tin lịch học đã đăng ký
            displayRegisteredSchedule(classCode, lichHoc, startDate);

            
        } else {
            Swal.fire('Không tìm thấy lớp học!', '', 'error');
        }
    } catch (error) {
        console.error('Error during update:', error);
        Swal.fire('Đăng ký không thành công!', error.message, 'error');
    }
});



async function timLopHoc(maLopMoi) {
    const baseUrlLopHoc = `https://noco-erp.com/api/v2/tables/mf1257zge0s9klj/records?viewId=vwws65e9ni6zcfa7&where=(Classcode,eq,${maLopMoi})`;
    const response = await fetch(baseUrlLopHoc, {
        method: 'GET',
        headers: {
            'xc-token': apiToken,
            'Content-Type': 'application/json'
        }
    });
    return response.json(); // Trả về toàn bộ dữ liệu đã lọc
}

async function updateLopHoc(data) {
    const updateUrl = `https://noco-erp.com/api/v2/tables/mf1257zge0s9klj/records`;
    const response = await fetch(updateUrl, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'xc-token': apiToken
        },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        const errorMsg = await response.text();
        throw new Error(`Error updating student: ${response.status} ${response.statusText} - ${errorMsg}`);
    }

    const result = await response.json();
    return result;

}

async function fetchAndCompareData() {
    document.getElementById('contentTable').style.display = 'block';

    const tenSanPham = document.getElementById('tenSanPham').value;
    const trinhDo = document.getElementById('trinhDo').value;
    const size = document.getElementById('size').value;
    const maLopMoi = document.getElementById('maLopMoi').value.trim();
    const lichHocMoi = document.getElementById('lichHocMoi').value.trim();
    const loaiGiaoVien = document.getElementById('loaiGiaoVien').value;
    const ngayKhaiGiangMoi = document.getElementById('ngayKhaiGiangMoi').value.trim();
    const loadingElement = document.getElementById('loading');
    const status = document.getElementById('status').value.trim();

    loadingElement.style.display = 'flex'; // Hiển thị màn chờ

    // Kiểm tra điều kiện hiển thị lịch học đã đăng ký
    if (
        status !== "HV.Chưa chọn lịch" &&
        maLopMoi &&
        lichHocMoi &&
        ngayKhaiGiangMoi
    ) {
        // Hiển thị lịch học đã đăng ký
        displayRegisteredSchedule(maLopMoi, lichHocMoi, ngayKhaiGiangMoi);
    } else {
        // Nếu chưa đăng ký, lấy danh sách lớp học để so sánh
        try {
            const filteredLopHocData = (await fetchDataLopHoc(tenSanPham, size, trinhDo, loaiGiaoVien)).list;

            if (filteredLopHocData && filteredLopHocData.length > 0) {
                // Hiển thị danh sách lịch học phù hợp
                displayResults(filteredLopHocData);
            } else {
                // Không tìm thấy lịch học phù hợp
                Swal.fire({
                    icon: 'warning',
                    title: 'Không có lịch học phù hợp',
                    text: 'Vui lòng chọn lại hoặc liên hệ hỗ trợ.'
                });
            }
        } catch (error) {
            console.error('Error fetching class data:', error);
            Swal.fire({
                icon: 'error',
                title: 'Lỗi',
                text: 'Đã xảy ra lỗi khi tải dữ liệu, vui lòng thử lại.'
            });
        }
    }

    loadingElement.style.display = 'none'; // Ẩn màn chờ
}

async function fetchDataLopHoc(Product, Size, Level, Teacher_type) {
    const baseUrlLopHoc = `https://noco-erp.com/api/v2/tables/mf1257zge0s9klj/records?viewId=vwws65e9ni6zcfa7&where=(soSlotConLai,lt,0)~and(Product,allof,${Product})~and(Size,allof,${Size})~and(Level,allof,${Level})~and(Teacher_type,allof,${Teacher_type})~and((Status,allof,Dự kiến khai giảng)~or(Status,allof,Chốt khai giảng))`;
    const loadingElement = document.getElementById('loading');
    loadingElement.style.display = 'flex'; // Hiển thị màn chờ
    const response = await fetch(baseUrlLopHoc, {
        method: 'GET',
        headers: {
            'xc-token': apiToken,
            'Content-Type': 'application/json'
        }
    });
    loadingElement.style.display = 'none'; // Ẩn màn chờ
    return response.json(); // Trả về toàn bộ dữ liệu đã lọc
}

//Đối với học viên chưa đăng ký lịch nhưng có lịch phù hợp
function getSchedule(records) {
    const lichHoc = [];
    const days = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];

    // Lặp qua từng bản ghi trong danh sách
    records.forEach(record => {
        const day = record.Weekday; // Lấy ngày học
        const time = record.Time; // Lấy giờ học
        if (day && time) {
            lichHoc.push(`${day}: ${time}`); // Thêm vào danh sách lịch học
        }
    });

    return lichHoc.length > 0 ? lichHoc.join(', ') : 'Không có lịch'; // Trả về lịch học hoặc thông báo không có lịch
}

// Hàm định dạng ngày sử dụng Intl.DateTimeFormat
function formatDate(dateString) {
    const dateParts = dateString.split('-');
    if (dateParts.length === 3) {
        const year = dateParts[0];
        const month = String(dateParts[1]).padStart(2, '0'); // Thêm số 0 đứng trước tháng
        const day = String(dateParts[2]).padStart(2, '0'); // Thêm số 0 đứng trước ngày

        const date = new Date(year, month - 1, day); // Tháng bắt đầu từ 0
        return `${day}/${month}/${year}`; // Định dạng theo kiểu dd/MM/yyyy
    }
    return dateString; // Trả về chuỗi gốc nếu không đúng định dạng
}

//Đối với học viên đã đăng ký lịch
function displayRegisteredSchedule(maLopMoi, lichHocMoi, ngayKhaiGiangMoi) {
    const tableSection = document.getElementById('tableSection');
    tableSection.innerHTML = ''; // Xóa nội dung cũ
    // Tạo lại bảng và tiêu đề
    const tableHTML = `
                    <table class="table table-bordered text-center" id="tableSection">
                        <thead class="table-light">
                            <tr>
                                <th>Mã lớp</th>
                                <th>Lịch học</th>
                                <th>Ngày khai giảng dự kiến</th>
                            </tr>
                        </thead>
                        <tbody id="tableBody" >
                            <tr>
                                <td>${maLopMoi}</td>
                                <td>${lichHocMoi}</td>
                                <td>${ngayKhaiGiangMoi}</td>
                            </tr>
                        </tbody>
                    </table>
                `;

    // Chèn HTML vào phần tử chứa bảng
    tableSection.innerHTML = tableHTML;

    // Hiển thị thông báo đăng ký thành công
    document.getElementById('registrationMessage').style.display = 'block';
    document.getElementById('contentForm').style.display = 'none';
    document.getElementById('contentTable').style.display = 'block';

    // Thay đổi tiêu đề
    document.getElementById('thongBaoLich').textContent = 'BẠN ĐÃ ĐĂNG KÝ LỊCH HỌC THÀNH CÔNG';

}


function displayResults(filteredData) {
    const tableLichHoc = document.getElementById('tableLichHoc');
    tableLichHoc.innerHTML = ` 
        <h1 class="mb-4 mt-4 text-center" style="color: #00509f; text-transform: uppercase; font-weight: 700; font-family: 'Montserrat', sans-serif;" id="thongBaoLich">Lịch học</h1>
        <div id="registrationMessage" class="alert alert-success" style="display: none; text-align: center;">
            Bạn đã đăng ký lớp học thành công, nếu muốn thay đổi lịch học vui lòng liên hệ zalo của ICANCONNECT để được hỗ trợ.
        </div>
        <div class="table-scroll">
        <div class="table-responsive">
            <table class="table table-bordered text-center" id="tableSection">
                <thead class="table-light">
                    <tr>
                        <th>Mã lớp</th>
                        <th>Lịch học</th>
                        <th>Ngày khai giảng dự kiến</th>
                        <th>Hành động</th> 
                    </tr>
                </thead>
                <tbody id="tableBody"></tbody>
            </table>
        </div>
        </div>
    `;

    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = ''; // Xóa nội dung cũ
    const dangKyLichNgoaiButton = document.getElementById('hienThidangKyLichNgoai'); // Nút đăng ký lịch khác
    const tenSanPham = document.getElementById('tenSanPham').value;
    if (tenSanPham == "Easy PASS") {
        dangKyLichNgoaiButton.style.display = 'none';
    }
    // Nhóm các bản ghi theo Classcode
    const groupedRecords = {};
    filteredData.forEach(record => {
        const classCode = record.Classcode; // Lấy mã lớp
        if (!groupedRecords[classCode]) {
            groupedRecords[classCode] = []; // Khởi tạo mảng nếu chưa có
        }
        groupedRecords[classCode].push(record); // Thêm bản ghi vào nhóm
    });

    // Tạo bảng từ các bản ghi đã nhóm
    for (const classCode in groupedRecords) {
        const records = groupedRecords[classCode];

        // Gọi getSchedule để lấy lịch học từ các bản ghi có cùng classCode
        const lichHoc = getSchedule(records); // Lấy lịch học
        const startDate = records[0].Start_date; // Ngày khai giảng từ bản ghi đầu tiên
        const startDateFormatted = formatDate(startDate);
        // Tạo một hàng mới cho bảng
        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td>${classCode}</td>
            <td>${lichHoc}</td>
            <td>${startDateFormatted}</td>
            <td><button id="register-${classCode}" class="btn btn-success btn-sm">Đăng ký</button></td>
        `;
        tableBody.appendChild(newRow); // Thêm hàng mới vào bảng

        // Gán sự kiện cho nút "Đăng ký"
        document.getElementById(`register-${classCode}`).addEventListener('click', function () {
            handleRegisterClick(classCode, lichHoc, startDate);
        });
    }

}

async function handleRegisterClick(classCode, lichHoc, startDate) {
    const result = await Swal.fire({
        title: 'Bạn có chắc chắn đăng ký lịch học này không?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Xác nhận',
        cancelButtonText: 'Hủy'
    });

    if (!result.isConfirmed) return;

    try {
        const lopHocData = (await timLopHoc(classCode)).list;

        if (lopHocData && lopHocData.length > 0) {
            for (const record of lopHocData) {
                const soDaDangKyHienTai = record.soDaDangKy || 0;
                const soSlotConLai = record.soSlotConLai || 0;

                if (soSlotConLai <= 0) {
                    Swal.fire('Lớp học đã đủ sĩ số, vui lòng chọn lớp khác.', '', 'warning');
                    fetchAndCompareData();
                    return;
                }

                const updatedLopHocData = {
                    Id: record.Id,
                   soDaDangKy: soDaDangKyHienTai + 1,
                };

                await updateLopHoc(updatedLopHocData);
            }

            const updatedData = {
                Id: document.getElementById('Id').value.trim(),
                maLopMoi: classCode,
                lichHocMoi: lichHoc,
                ngayKhaiGiangMoi: startDate,
                trangThai: 'Đã chọn lịch thành công',
                status: 'HV. Chọn lịch hệ thống'
            };

            await updateStudentData(updatedData);

            // fetchAndCompareData();
            displayRegisteredSchedule(updatedData.maLopMoi, updatedData.lichHocMoi, updatedData.ngayKhaiGiangMoi)
        } else {
            Swal.fire('Không tìm thấy lớp học!', '', 'error');
        }
    } catch (error) {
        console.error('Error during update:', error);
        Swal.fire('Đăng ký không thành công!', error.message, 'error');
    }
}
