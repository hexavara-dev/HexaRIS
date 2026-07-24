<?php

use App\Audit\Concerns\IsAudited;
use App\Audit\Models\AuditActivity;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Fixture model used only by this test.
 */
class AuditedWidget extends Model
{
    use IsAudited;

    protected $table = 'audited_widgets';

    protected $guarded = [];

    protected $hidden = ['secret'];
}

beforeEach(function () {
    Schema::create('audited_widgets', function (Blueprint $table) {
        $table->id();
        $table->string('name');
        $table->string('secret')->nullable();
        $table->timestamps();
    });
});

it('logs creation with the new attributes', function () {
    $widget = AuditedWidget::create(['name' => 'Alpha']);

    $row = AuditActivity::where('event', 'created')->where('subject_id', $widget->id)->first();
    expect($row)->not->toBeNull()
        ->and($row->subject_type)->toBe(AuditedWidget::class)
        ->and($row->attribute_changes['new']['name'])->toBe('Alpha')
        ->and($row->attribute_changes['new'])->not->toHaveKey('created_at')
        ->and($row->attribute_changes['new'])->not->toHaveKey('updated_at');
});

it('logs an update with before and after', function () {
    $widget = AuditedWidget::create(['name' => 'Alpha']);
    $widget->update(['name' => 'Beta']);

    $row = AuditActivity::where('event', 'updated')->where('subject_id', $widget->id)->first();
    expect($row->attribute_changes['old']['name'])->toBe('Alpha')
        ->and($row->attribute_changes['new']['name'])->toBe('Beta');
});

it('logs deletion', function () {
    $widget = AuditedWidget::create(['name' => 'Alpha']);
    $id = $widget->id;
    $widget->delete();

    expect(AuditActivity::where('event', 'deleted')->where('subject_id', $id)->exists())->toBeTrue();
});

it('never records hidden attributes', function () {
    $widget = AuditedWidget::create(['name' => 'Alpha', 'secret' => 'p@ss']);

    $row = AuditActivity::where('event', 'created')->where('subject_id', $widget->id)->first();
    expect($row->attribute_changes['new'])->not->toHaveKey('secret');
});

it('does not record an update when only hidden attributes changed', function () {
    $widget = AuditedWidget::create(['name' => 'Alpha']);
    AuditActivity::query()->delete();

    $widget->update(['secret' => 'rotated']);

    expect(AuditActivity::where('event', 'updated')->where('subject_id', $widget->id)->exists())->toBeFalse();
});

it('does not record an update when only timestamps changed', function () {
    $widget = AuditedWidget::create(['name' => 'Alpha']);
    AuditActivity::query()->delete();

    $widget->touch();

    expect(AuditActivity::where('event', 'updated')->where('subject_id', $widget->id)->exists())->toBeFalse();
});
